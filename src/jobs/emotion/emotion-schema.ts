

export enum EmotionIntensity {
    Low = "low",
    Medium = "medium",
    High = "high"
}

// gives us the radius in the circle
const emotionIntensityRadians = {
    [EmotionIntensity.Low]: 0.2,
    [EmotionIntensity.Medium]: 0.5,
    [EmotionIntensity.High]: 0.8
}

export enum PrimaryEmotion {
    Joy = "joy",
    Trust = "trust",
    Fear = "fear",
    Surprise = "surprise",
    Sadness = "sadness",
    Disgust = "disgust",
    Anger = "anger",
    Anticipation = "anticipation"
}


export enum BaseEmotion {
    Ecstasy = "ecstasy",
    Admiration = "admiration",
    Terror = "terror",
    Amazement = "amazement",
    Grief = "grief",
    Loathing = "loathing",
    Rage = "rage",
    Vigilance = "vigilance",
}

export enum SecondaryEmotion {
    Joy = "joy",
    Serenity = "serenity",
    Trust = "trust",
    Acceptance = "acceptance",
    Fear = "fear",
    Apprehension = "apprehension",
    Surprise = "surprise",
    Distraction = "distraction",
    Sadness = "sadness",
    Pensiveness = "pensiveness",
    Disgust = "disgust",
    Boredom = "boredom",
    Anger = "anger",
    Annoyance = "annoyance",
    Anticipation = "anticipation",
    Interest = "interest",
}

export enum ComplexEmotion {
    Love = "love",
    Submission = "submission",
    Awe = "awe",
    Disapproval = "disapproval",
    Remorse = "remorse",
    Contempt = "contempt",
    Aggressiveness = "aggressiveness",
    Optimism = "optimism"
}

export enum EmotionType {
    Base = "base",
    Primary = "primary",
    Secondary = "secondary",
    Complex = "complex"
}

export type Emotion = BaseEmotion | SecondaryEmotion | ComplexEmotion;

export interface IEmotionPetal {
    base: BaseEmotion;
    primary: PrimaryEmotion;
    secondary: SecondaryEmotion;
    complex: [ComplexEmotion, ComplexEmotion];
}


export interface IEmotion {
    emotion: Emotion;
    intensity: EmotionIntensity;
    type: EmotionType;
    opposite: Emotion;
    color?: string;
    tags?: string[];
    sensation?: string;
    message?: string;
    purpose?: string;
}


// we could have a function that converts an IEmotion into a position around a circle,
// but that seems like an implementation detail and not some inherent property