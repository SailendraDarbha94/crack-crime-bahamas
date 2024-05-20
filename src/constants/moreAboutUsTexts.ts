export interface AboutUsParagraphs {
  id: number;
  heading: string;
  initialContent: string;
  moreContent: string;
}

export interface FAQs {
  id: number,
  question: string;
  answer: string;
}

export const aboutUsParagraphs: AboutUsParagraphs[] = [
  {
    id: 1,
    heading: "Who We Are",
    initialContent: `Crime Stoppers is a community action programme that gives us as residents the opportunity to become involved in the fight against crime.
    The programme works because residents care and do not want crime in their neighborhoods.`,
    moreContent: `Many of our communities are small with people knowing each other from birth.
    Our challenge is to make residents the eyes of the community and partners of the law without endangering them by exposing their identity to even their next door neighbour.
    Crime Stoppers Bahamas was officially launched on November 27, 2001. Safe Bahamas provided the initial start up money.
    The programme is governed by a volunteer civilian Board of Directors with an officer from The Royal Bahamas Police Force serving as a coordinator to the Board.
    Crime Stoppers Bahamas is a non-government organization and we depend on donations, membership and corporate sponsors to keep the programme running.
    We are affiliated with Crime Stoppers International that has over 1200 similar programmes around the world.`,
  },
  {
    id: 2,
    heading: "Mission and Vision",
    initialContent:
      "Our Mission is the ongoing development and implementation of an effective crime solving programme which serves the entire Bahamian community.",
    moreContent: `Our primary objective is the building of a dynamic relationship between the Community, Media and Law Enforcement all working together for a safer, more secure living and working environment for all Bahamian residents and visitors.
    Our Vision is to rid the Bahamas of the scourge of crime and violence so that residents and visitors alike can feel free to walk about day and night and enjoy our beautiful Bahama land.`,
  },
  {
    id: 3,
    heading: "How It Works",
    initialContent: `If you have ANY information on ANY crime then call at ANY time, 365 days a year.
    Your call will be automatically answered in USA or Canada. Phone lines are not police lines and are sponsored by Crime Stoppers.
    Your call cannot be traced as there is no Caller Id, or any similar features attached to the lines.
    In Nassau/New Providence/Paradise Island call 328-TIPS(8477) or in the Family Islands call 1-242-300-8477 (TOLL free number).`,
    moreContent: `The overseas operator will take the relevant information and you will NEVER be asked for your name or where you calling from, you remain Anonymous (no names asked).
    After receiving the information the operator will give you a Control Number that you should keep confidential.
    Call back after 30 days and give the operator your Control Number and you will be told the status of your case and if you are eligible for a cash reward payment of up to $1000.
    If you are eligible for a reward you indicate any public place in Nassau where you want money dropped off during daylight hours and Crime Stoppers will arrange for a civilian to drop off the reward.`,
  },
];


export const frequentlyAskedQuestionsFirstBlock:FAQs[] = [
  {
    id: 1,
    question: "How many crimes have you stopped so far",
    answer: "Crime Stoppers Bahamas has partnered with the police to help solve 188 major crimes in recent times."
  },
  {
    id: 2,
    question: "When was last CSI event and where was it held",
    answer: "The 37th Annual Crime Stoppers International Conference was held in Port-of-Spain, Trinidad from October 1-5."
  },
  {
    id:3,
    question: "How can I support Crime Stoppers Bahamas",
    answer: "You can support us by becoming a member, providing a tip or sending a donation cheque to Crime Stoppers Bahamas, P.O. Box N 665, Nassau, Bahamas. Thank you for your consideration."
  },
  {
    id: 4,
    question: "When did Crime Stoppers Officialy start",
    answer: "Crime Stoppers Bahamas was officially launched on November 27, 2001."
  },
]

export const frequentlyAskedQuestionsSecondBlock:FAQs[] = [
  {
    id: 1,
    question: "What is Crime Watch",
    answer: "The National Crime Prevention Unit (NCPO) of The Royal Bahamas Police Force is responsible for partnering with the community to prevent crime. They have a number of programmes in place including assisting neigbourhoods and businesses to form crime watch group"
  },
  {
    id: 2,
    question: "How can I give a tip",
    answer: "You can download our app and send a tip anonymously or call us at 328-8477 if you are in Nassau or 1242-300-8477 if you are in Family Islands"
  },
  {
    id: 3,
    question: "Is Crime Stoppers a Police Initiative",
    answer: "We are a Non Governmental Organisation that is affiliated with the Local Police but we are not part of any Law Enforcement Agencies"
  },
]