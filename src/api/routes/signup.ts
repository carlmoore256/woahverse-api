import { Router, Handler, Request } from "express";
import jwt, { JwtPayload, VerifyCallback } from "jsonwebtoken";
import db from "../../database/database";
import { QuestionTemplate, SignupSession } from "@prisma/client";
import { query, body } from "express-validator";
import { validateMiddleware } from "../middleware/validateMiddleware";
import { isAnswerSatisfactory } from "../../chains/signup-chain";

const router = Router();

interface RequestWithSignupSession extends Request {
    signupSession: SignupSession;
    progress: number;
}

const establishSession: Handler = async (req, res, next) => {
    // here we will see if the user has a cookie that points to
    // an open signup session. This will lay down the law in terms
    // of where they are at within the process.

    const token = req.cookies.token;

    if (!token) {
        const newSignupSession = await db.signupSession.create({
            data: {},
        });

        // sign a JWT
        const token = jwt.sign(
            { id: newSignupSession.id },
            process.env.JWT_SECRET as string
        );

        // set the cookie
        res.cookie("signupSession", token, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 3600000 * 24, // 24 hours
        });

        (req as RequestWithSignupSession).signupSession = newSignupSession;
    } else {
        jwt.verify(
            token,
            process.env.JWT_SECRET as string,
            (err: any, payload: any) => {
                if (err) {
                    res.clearCookie("signupSession"); // just clear it, the progress is lost
                    res.status(401).send("Invalid token");
                    return;
                }
            }
        );
    }

    next();
};

async function getUnansweredTemplates(signupSession: SignupSession) {
    const unansweredTemplates = await db.$queryRaw`
        SELECT qt.*
        FROM question_template qt
        LEFT JOIN (
            SELECT sq.template_id 
            FROM signup_question sq
            INNER JOIN signup_response sr ON sq.id = sr.signup_question_id
            WHERE sq.signup_session_id = 'foobar'
        ) AS answered_questions ON qt.id = answered_questions.template_id
        WHERE answered_questions.template_id IS NULL AND qt.scenario = 'SIGNUP';
    `;
    return unansweredTemplates as QuestionTemplate[];
}

// injection will add a preface to the prompt, to make the bot have a tone
async function getRandomNextQuestion(signupSession: SignupSession, injection: string) {
    const unansweredTemplates = await getUnansweredTemplates(signupSession);
    
    if (unansweredTemplates.length === 0) {
        return null;
    }
    
    const randTemplateIdx = Math.floor(
        Math.random() * unansweredTemplates.length
    );

    // if previousQuestionId, avoid re-asking the same question
    const randTemplate = unansweredTemplates[randTemplateIdx];

    // here we'll create a fancy question
    const stylizedQuestionText = "STYLIZED! " + randTemplate.text;

    // insert this new question into the db
    const newQuestion = await db.signupQuestion.create({
        data: {
            text: stylizedQuestionText,
            template: {
                connect: {
                    id: randTemplate.id,
                },
            },
            signupSession: {
                connect: {
                    id: signupSession.id,
                },
            },
        },
    });
    return newQuestion;
}

export default (parent: Router) => {
    parent.use("/signup", router);

    router.get("/test", (req, res) => {
        res.send("Hello, world!");
    });

    // gets the next question
    // users can choose to be asked later, which will ask them in a different way
    // remember to include rate limiting to prevent spamming
    router.get(
        "/next-question",
        query("previousQuestionId").optional().escape(),
        validateMiddleware,
        establishSession,
        async (req, res) => {
            const signupSession = (req as RequestWithSignupSession)
                .signupSession;
            const nextQuestion = await getRandomNextQuestion(signupSession)
            if (!nextQuestion) {
                res.send({ status: "complete" });
            }
            res.send({nextQuestion});
        }
    );

    router.post(
        "/answer-question",
        body("signupQuestionId").notEmpty().escape(),
        body("text").notEmpty().escape(),
        validateMiddleware,
        establishSession,
        async (req, res) => {
            try {
                const signupSession = (req as RequestWithSignupSession)
                    .signupSession;

                // here we need to determine if the answer is satisfactory or not
                const isSatisfactory = await isAnswerSatisfactory(req.body.text);

                if (isSatisfactory) {
                    // create the signup response
                    await db.signupResponse.create({
                        data: {
                            text: req.body.text as string,
                            signupSession: {
                                connect: {
                                    id: signupSession.id,
                                },
                            },
                            signupQuestion: {
                                connect: {
                                    id: req.body.signupQuestionId as string,
                                },
                            },
                        },
                    });
                }

                const nextQuestion = await getRandomNextQuestion(
                    signupSession,
                    isSatisfactory ? "Great! " : "The question is not complete, try another"
                );

                if (!nextQuestion) {
                    res.send({ status: "complete" });
                }
                res.send({ status: "success", nextQuestion });
            } catch (err) {
                console.log("Error: " + err);
                res.status(400).send("Invalid request");
            }
        }
    );

    // each one of the multiple choice for socials should lead to an oauth verify
    // if they answer "privacy" for what do you value most, maybe we can avoid asking
    // them for twitter
    // we can also have their woah think about the questions it should ask
    // have the question have a voice generator
};
