SELECT qt.*
FROM question_template qt
LEFT JOIN (
    SELECT sq.template_id 
    FROM signup_question sq
    INNER JOIN signup_response sr ON sq.id = sr.signup_question_id
    WHERE sq.signup_session_id = 'foobar'
) AS answered_questions ON qt.id = answered_questions.template_id
WHERE answered_questions.template_id IS NULL AND qt.scenario = 'SIGNUP';
