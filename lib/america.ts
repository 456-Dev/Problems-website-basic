// One Question for America — content for /america.
// Every quote, place and date here was read off the film itself (burned-in
// subtitles + the place/date rail), not paraphrased. `t` = seconds into the
// YouTube upload where that frame is; `img` = frame grabbed at t+1.

export const VIDEO_ID = "rypQce5ik7w";

export type Asked = { t: number; q: string; place: string; date: string };

// Question #1 — what strangers would ask everyone in America.
// Film order (it runs in reverse: New York back to Venice Beach).
export const asked: Asked[] = [
  { t: 121, q: "Like, why can't we get along?", place: "Staten Island", date: "July 14th 2024" },
  { t: 188, q: "Why is there so much violence?", place: "Staten Island", date: "July 14th 2024" },
  { t: 657, q: "What's the meaning of life?", place: "Outskirts of D.C.", date: "July 13th 2024" },
  { t: 763, q: "Why do you not love America anymore?", place: "Marlinton", date: "July 13th 2024" },
  { t: 822, q: "Why are they so divided?", place: "Marlinton", date: "July 13th 2024" },
  { t: 1026, q: "Dogs or cats, which do you like better?", place: "Marion", date: "July 13th 2024" },
  { t: 1104, q: "Why are you so angry?", place: "Cherokee", date: "July 12th 2024" },
  { t: 1220, q: "Why don't you do more to preserve the soil?", place: "Smoky Mountains", date: "July 12th 2024" },
  { t: 1386, q: "Why are you the way you are?", place: "Gatlinburg", date: "July 12th 2024" },
  { t: 1647, q: "My question would be, why are you questioning us?", place: "Nashville", date: "July 11th 2024" },
  { t: 1690, q: "Do you really think this is the greatest country in the world?", place: "Nashville", date: "July 11th 2024" },
  { t: 1709, q: "Why is it so expensive?", place: "Nashville", date: "July 11th 2024" },
  { t: 1724, q: "Why do we have two dummies to vote for in the election?", place: "Memphis", date: "July 10th 2024" },
  { t: 1822, q: "When are we going to Make America Great Again?", place: "Memphis", date: "July 10th 2024" },
  { t: 2126, q: "You got a sister?", place: "Hernando", date: "July 10th 2024" },
  { t: 2207, q: "Why is there so much division in our world?", place: "Horseshoe Casino", date: "July 10th 2024" },
  { t: 2700, q: "Who taught you the things that you believe?", place: "Muskogee", date: "July 9th 2024" },
  { t: 3068, q: "Do you know where you're going to spend eternity?", place: "Colby", date: "July 8th 2024" },
  { t: 3233, q: "Where did you learn how to drive?", place: "The Oasis", date: "July 8th 2024" },
  { t: 3295, q: "Why ain't we free anymore?", place: "Denver", date: "July 8th 2024" },
  { t: 3340, q: "What's your favorite song and why?", place: "Rocky Mountains", date: "July 7th 2024" },
  { t: 3372, q: "When will the inflation go down?", place: "Vail", date: "July 7th 2024" },
  { t: 3431, q: "Is your head up your ass?", place: "Vail", date: "July 7th 2024" },
  { t: 3566, q: "What's it like to really be yourself, be you?", place: "Moab", date: "July 6th 2024" },
  { t: 3833, q: "Why does race matter?", place: "Las Vegas", date: "July 4th 2024" },
  { t: 3856, q: "If you die tonight, where are you going? Hell or Heaven?", place: "Las Vegas", date: "July 4th 2024" },
  { t: 3876, q: "What are your thoughts on quantum computing?", place: "Las Vegas", date: "July 4th 2024" },
  { t: 4228, q: "Why can't there be more love?", place: "Venice Beach", date: "July 4th 2024" },
  { t: 4303, q: "Would you buy a house right now?", place: "Venice Beach", date: "July 4th 2024" },
];

// Question #2 — the question, flipped back on whoever asked it.
export const flipped: { ask: number; answer: number; q: string; a: string; place: string }[] = [
  { ask: 121, answer: 127, q: "Why can't we get along?", a: "Because Jason's here", place: "Staten Island" },
  { ask: 1026, answer: 1032, q: "Dogs or cats?", a: "Dogs. We have a lot of dogs and we have far too many cats", place: "Marion" },
  { ask: 1386, answer: 1392, q: "Why are you the way you are?", a: "My mom, our moms are scary", place: "Gatlinburg" },
  { ask: 3431, answer: 3435, q: "Is your head up your ass?", a: "No, mine's not", place: "Vail" },
];

// Question #3 — are you happy? (83% said yes, per the book's section notes)
export const HAPPY = { total: 221, yes: 183 };
export const happyLines: { t: number; a: string; place: string }[] = [
  { t: 920, a: "Always!", place: "Hinton" },
  { t: 922, a: "I'm breathing", place: "Hinton" },
  { t: 1962, a: "Even with my hole in the wall I'm happy", place: "Graceland" },
  { t: 435, a: "I'd say I'm happy, but not satisfied", place: "District of Columbia" },
  { t: 138, a: "No, absolutely not!", place: "Staten Island" },
];

// The route, in the order it was driven. `t` = where that stop starts in the film.
export const days: { date: string; stops: [string, number][] }[] = [
  { date: "July 4", stops: [["Venice Beach", 4095], ["Orange County", 4080], ["Las Vegas", 3825]] },
  { date: "July 5", stops: [["Las Vegas", 3780], ["Walmart", 3720], ["Bicknell", 3600]] },
  { date: "July 6", stops: [["Moab", 3480]] },
  { date: "July 7", stops: [["Vail", 3360], ["Rocky Mountains", 3330]] },
  { date: "July 8", stops: [["Denver", 3300], ["The Oasis", 3150], ["Colby", 3060], ["Hays", 3015], ["Tulsa", 2910]] },
  { date: "July 9", stops: [["Tulsa", 2790], ["Muskogee", 2640], ["Bill Clinton Library", 2490], ["Little Rock", 2370], ["Horseshoe Casino", 2205]] },
  { date: "July 10", stops: [["Hernando", 2010], ["Graceland", 1875], ["Memphis", 1725]] },
  { date: "July 11", stops: [["Nashville", 1455], ["Knoxville", 1440], ["Buc-ee's", 1410]] },
  { date: "July 12", stops: [["Gatlinburg", 1305], ["Smoky Mountains", 1200], ["Cherokee", 1080]] },
  { date: "July 13", stops: [["Marion", 945], ["Hinton", 900], ["Marlinton", 765], ["Green Bank", 690], ["Outskirts of D.C.", 630], ["District of Columbia", 405]] },
  { date: "July 14", stops: [["Paterson", 225], ["Staten Island", 105]] },
];

export const frame = (t: number) => `/assets/america/film/${t}.jpg`;
export const clock = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
