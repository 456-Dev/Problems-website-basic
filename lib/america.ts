// One Question for America — content for /america.
// Places, dates and questions were read off the film itself (the place/date rail
// and the burned-in subtitles). Each stop gives away one question at most, never an answer.

export const VIDEO_ID = "rypQce5ik7w";

export type Stop = {
  place: string;
  where?: string;          // state, shown under the place name
  date: string;            // as on the film's rail
  day: number;             // day of the drive, 1 = July 4th
  t: number;               // seconds into the film where this stop starts
  img: string;             // frame from this stop
  ask?: string;            // one question someone here asked America
  ll: [number, number];    // lon, lat (approximate where the film doesn't say)
};

// In the order they were driven. The film plays them backwards.
export const stops: Stop[] = [
  { place: "Venice Beach", where: "California", date: "July 4th 2024", day: 1, t: 4087, img: "4228", ask: "Why can't there be more love?", ll: [-118.47, 33.99] },
  { place: "Orange County", where: "California", date: "July 4th 2024", day: 1, t: 4072, img: "s4085", ll: [-117.83, 33.72] },
  { place: "Las Vegas", where: "Nevada", date: "July 4th 2024", day: 1, t: 3772, img: "3876", ask: "What are your thoughts on quantum computing?", ll: [-115.17, 36.11] },
  { place: "Bicknell", where: "Utah", date: "July 5th 2024", day: 2, t: 3592, img: "s3640", ll: [-111.55, 38.34] },
  { place: "Moab", where: "Utah", date: "July 6th 2024", day: 3, t: 3472, img: "3566", ask: "What's it like to really be yourself, be you?", ll: [-109.55, 38.57] },
  { place: "Vail", where: "Colorado", date: "July 7th 2024", day: 4, t: 3365, img: "3431", ask: "Is your head up your ass?", ll: [-106.37, 39.64] },
  { place: "Rocky Mountains", where: "Colorado", date: "July 7th 2024", day: 4, t: 3322, img: "3340", ask: "What's your favorite song and why?", ll: [-105.68, 40.34] },
  { place: "Denver", where: "Colorado", date: "July 8th 2024", day: 5, t: 3290, img: "3295", ask: "Why ain't we free anymore?", ll: [-104.99, 39.74] },
  { place: "The Oasis", where: "somewhere on I-70", date: "July 8th 2024", day: 5, t: 3142, img: "3233", ask: "Where did you learn how to drive?", ll: [-102.9, 39.3] },
  { place: "Colby", where: "Kansas", date: "July 8th 2024", day: 5, t: 3052, img: "3068", ask: "Do you know where you're going to spend eternity?", ll: [-101.05, 39.4] },
  { place: "Hays", where: "Kansas", date: "July 8th 2024", day: 5, t: 3007, img: "s3030", ll: [-99.33, 38.88] },
  { place: "Tulsa", where: "Oklahoma", date: "July 8th 2024", day: 5, t: 2782, img: "s2850", ll: [-95.99, 36.15] },
  { place: "Muskogee", where: "Oklahoma", date: "July 9th 2024", day: 6, t: 2632, img: "2700", ask: "Who taught you the things that you believe?", ll: [-95.37, 35.75] },
  { place: "Bill Clinton Library", where: "Little Rock, Arkansas", date: "July 9th 2024", day: 6, t: 2484, img: "s2510", ask: "What do I need to do to make sure that I listen to…", ll: [-92.26, 34.75] },
  { place: "Little Rock", where: "Arkansas", date: "July 9th 2024", day: 6, t: 2362, img: "s2430", ll: [-92.29, 34.75] },
  { place: "Horseshoe Casino", where: "Mississippi", date: "July 10th 2024", day: 7, t: 2197, img: "2207", ask: "Why is there so much division in our world?", ll: [-90.29, 34.85] },
  { place: "Hernando", where: "Mississippi", date: "July 10th 2024", day: 7, t: 2002, img: "2126", ask: "You got a sister?", ll: [-89.99, 34.82] },
  { place: "Graceland", where: "Tennessee", date: "July 10th 2024", day: 7, t: 1867, img: "s1880", ll: [-90.03, 35.05] },
  { place: "Memphis", where: "Tennessee", date: "July 10th 2024", day: 7, t: 1717, img: "1724", ask: "Why do we have two dummies to vote for in the election?", ll: [-90.05, 35.15] },
  { place: "Nashville", where: "Tennessee", date: "July 11th 2024", day: 8, t: 1447, img: "1647", ask: "Why are you questioning us?", ll: [-86.78, 36.16] },
  { place: "Buc-ee's", where: "Tennessee", date: "July 11th 2024", day: 8, t: 1402, img: "s1415", ll: [-83.67, 35.94] },
  { place: "Gatlinburg", where: "Tennessee", date: "July 12th 2024", day: 9, t: 1297, img: "1386", ask: "Why are you the way you are?", ll: [-83.51, 35.71] },
  { place: "Smoky Mountains", where: "Tennessee", date: "July 12th 2024", day: 9, t: 1192, img: "1220", ask: "Why don't you do more to preserve the soil?", ll: [-83.49, 35.61] },
  { place: "Cherokee", where: "North Carolina", date: "July 12th 2024", day: 9, t: 1072, img: "1104", ask: "Why are you so angry?", ll: [-83.31, 35.47] },
  { place: "Marion", where: "Virginia", date: "July 13th 2024", day: 10, t: 937, img: "1026", ask: "Dogs or cats, which do you like better?", ll: [-81.51, 36.83] },
  { place: "Hinton", where: "West Virginia", date: "July 13th 2024", day: 10, t: 892, img: "s905", ll: [-80.89, 37.67] },
  { place: "Marlinton", where: "West Virginia", date: "July 13th 2024", day: 10, t: 757, img: "763", ask: "Why do you not love America anymore?", ll: [-80.09, 38.22] },
  { place: "Green Bank", where: "West Virginia", date: "July 13th 2024", day: 10, t: 682, img: "s700", ll: [-79.83, 38.42] },
  { place: "Outskirts of D.C.", where: "", date: "July 13th 2024", day: 10, t: 622, img: "657", ask: "What's the meaning of life?", ll: [-77.35, 38.85] },
  { place: "Washington", where: "District of Columbia", date: "July 13th 2024", day: 10, t: 397, img: "s410", ll: [-77.05, 38.89] },
  { place: "Paterson", where: "New Jersey", date: "July 14th 2024", day: 11, t: 217, img: "s230", ask: "Who are you going to choose for president?", ll: [-74.17, 40.92] },
  { place: "Staten Island", where: "New York", date: "July 14th 2024", day: 11, t: 97, img: "121", ask: "Why can't we get along?", ll: [-74.15, 40.58] },
];

export const questions = [
  "What is one question you would ask everyone in America?",
  "Answer your own question.",
  "Are you happy?",
];

export const frame = (img: string) => `/assets/america/film/${img}.jpg`;
