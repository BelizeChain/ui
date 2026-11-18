// Maya Academy — lesson content and knowledge checks.
//
// This file is the educational payload behind the Community pallet's
// `education_modules`. The chain stores only a title, a description and a
// reward; everything a learner actually reads lives here, so it can be
// reviewed and corrected without a runtime upgrade.
//
// Modules are keyed by the on-chain `module_id`. A module with no entry here
// still renders from its on-chain description — it simply has no lesson flow
// and no knowledge check, and the page must not pretend otherwise.
//
// ACCURACY RULES for anything added below:
//   - BelizeChain facts must match this repo or the live chain.
//   - Belize national facts must be stable and uncontroversial (currency peg,
//     district names). Do not invent statistics, dates, or institution names.
//   - General finance/agronomy must be textbook-standard, not promotional.
//   - Never promise a return, a profit, or a reward the chain does not pay.

/** One readable section of a lesson. */
export interface Lesson {
  title: string;
  /** Paragraphs, in reading order. Plain prose — no markup. */
  body: string[];
}

/** One multiple-choice question. Exactly one option is correct. */
export interface QuizQuestion {
  question: string;
  options: string[];
  /** Index into `options`. */
  correctIndex: number;
  /** Shown after answering, right or wrong. Never hide the reasoning. */
  explanation: string;
}

export interface AcademyModule {
  moduleId: number;
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

/**
 * Pass mark, as a fraction of the quiz answered correctly.
 *
 * 0.75 with a four-question quiz means three correct answers. Anything lower
 * lets a learner pass by guessing; anything higher turns one careless tap into
 * a full retry.
 */
export const PASS_THRESHOLD = 0.75;

/** Shortest honest description of what passing does and does not prove. */
export const ASSESSMENT_DISCLOSURE =
  'This check is scored in your browser to help you confirm you understood the material. ' +
  'It is not an accredited qualification, and the chain records completion on your own ' +
  'attestation — it does not verify your answers.';

export const ACADEMY_MODULES: AcademyModule[] = [
  // ── Module 0 ───────────────────────────────────────────────────────────────
  {
    moduleId: 0,
    lessons: [
      {
        title: 'Two currencies, one country',
        body: [
          'Belize uses the Belize dollar, written BZD and often shown as $. It has been fixed at two Belize dollars to one US dollar for decades. That fixed rate is the anchor for almost every price in the country: when people say a price is "stable", they usually mean stable against the US dollar.',
          'BelizeChain carries two digital units. DALLA is the network\'s own token: its supply is set by the chain, and its price is not fixed to anything. bBZD is designed to hold the same value as a physical Belize dollar, one for one.',
          'The difference matters. If you are saving for next month\'s rent, a unit designed to stay level with the Belize dollar removes the risk that your savings shrink. If you are paying network fees, you use DALLA. Mixing the two up is the single most common mistake new users make.',
        ],
      },
      {
        title: 'A budget you will actually keep',
        body: [
          'A budget is not a prediction, it is a decision made in advance. Write down what comes in each month, then what must go out: housing, food, transport, utilities, school costs, debt payments. What is left is not "spare" money — it is the money that does the work of protecting you.',
          'Split that remainder deliberately. First, an emergency fund: enough to cover one to three months of essentials, held somewhere you can reach within a day. Second, whatever you are saving toward. Third, anything else.',
          'The most common failure is a budget with no emergency line. Without it, one broken refrigerator becomes a loan, and the loan becomes next month\'s deficit. An emergency fund is not an investment; its job is to stop a small problem becoming a debt.',
        ],
      },
      {
        title: 'Saving, interest, and the cost of borrowing',
        body: [
          'Interest works in two directions. Money you save earns interest; money you borrow costs interest. When the rate you pay on a debt is higher than the rate you earn on savings — which is almost always true for short-term consumer credit — paying the debt down is the better use of spare cash.',
          'Watch the period, not just the number. "Five percent" means very different things per month and per year. A monthly rate of five percent is roughly sixty percent over a year. Always ask: per what period, and on what balance.',
          'Two habits protect a household more than any single product. Keep borrowing below what you can repay from one month\'s income if things go wrong. And check your own records against the institution\'s at least once a month, because errors are far easier to correct early.',
        ],
      },
    ],
    quiz: [
      {
        question: 'What is the fixed exchange rate between the Belize dollar and the US dollar?',
        options: ['1 BZD = 1 USD', '2 BZD = 1 USD', 'It floats daily', 'It is set by BelizeChain'],
        correctIndex: 1,
        explanation:
          'The Belize dollar has been pegged at two BZD to one USD for decades. BelizeChain does not set it — the peg is a national monetary arrangement.',
      },
      {
        question: 'You are saving for rent due next month. Which unit is designed to hold a steady value?',
        options: [
          'DALLA, because it is the native token',
          'Neither — both float freely',
          'bBZD, because it is designed to track the Belize dollar one to one',
          'Whichever has the higher price that day',
        ],
        correctIndex: 2,
        explanation:
          'bBZD is the unit intended to stay level with the Belize dollar. DALLA is the network token and its price is not fixed.',
      },
      {
        question: 'What is the main job of an emergency fund?',
        options: [
          'To stop a small unexpected cost turning into debt',
          'To earn the highest possible return',
          'To pay network fees',
          'To replace a monthly budget',
        ],
        correctIndex: 0,
        explanation:
          'An emergency fund is insurance against surprises, not an investment. Its value is that it prevents borrowing at short notice.',
      },
      {
        question: 'A loan is advertised at "5% interest". What must you check first?',
        options: [
          'Nothing — 5% is 5%',
          'Whether the lender accepts DALLA',
          'Whether the rate changes with the US dollar',
          'Whether it is per month or per year, and on what balance',
        ],
        correctIndex: 3,
        explanation:
          'The period and the balance the rate applies to change the real cost enormously. 5% per month is roughly 60% per year.',
      },
    ],
  },

  // ── Module 1 ───────────────────────────────────────────────────────────────
  {
    moduleId: 1,
    lessons: [
      {
        title: 'Feeding soil, not just plants',
        body: [
          'A crop takes nutrients out of the ground. If nothing goes back, yields fall year after year no matter how much you water or weed. Soil organic matter — the decomposed plant and animal material in the ground — is what holds nutrients and water where roots can reach them.',
          'Compost is the cheapest way to rebuild it. Alternate layers of dry material (crop residue, dry leaves, straw) with wet material (kitchen scraps, fresh plant trimmings, manure from animals that eat plants), keep it as damp as a wrung-out cloth, and turn it occasionally. What comes out is dark, crumbly and smells of earth, not rot.',
          'Do not compost meat, bones, oils, or manure from dogs and cats. They attract pests and can carry pathogens that harm people working the plot.',
        ],
      },
      {
        title: 'Rotation and what it buys you',
        body: [
          'Growing the same crop in the same bed every season invites two problems: pests and diseases that specialise in that crop build up, and the same nutrients get drawn down while others sit unused.',
          'Rotating across plant families interrupts both. A simple rotation groups crops into leaf, fruit, root and legume, and never follows one group with itself. Legumes — beans, peas, pigeon peas — are especially useful because they host bacteria in their roots that fix nitrogen from the air into a form plants can use, leaving the bed richer for the next crop.',
          'Rotation also spreads labour. Different crops peak at different times, so a plot under rotation provides something across more of the year than a single planting does.',
        ],
      },
      {
        title: 'Water: keeping what falls',
        body: [
          'Belize receives a great deal of rain, and still loses most of it. Bare soil sheds water downhill, taking topsoil with it. Covering the soil — mulch, living ground cover, or a mulch of crop residue — slows the water, keeps the surface cooler, and cuts evaporation between showers.',
          'On sloped ground, work across the slope rather than up and down it. Rows, drains and planting lines that follow the contour slow runoff and give water time to soak in. A simple swale or a line of deep-rooted plants along the contour does the same job cheaply.',
          'Irrigate the root zone, not the whole plot. Drip lines and hand watering at the base of the plant put water where roots can use it, where sprinkling loses a large share to evaporation and encourages leaf disease. Water early in the day so foliage dries before night.',
        ],
      },
    ],
    quiz: [
      {
        question: 'Why do legumes such as beans and pigeon peas improve a bed for the next crop?',
        options: [
          'They shade out weeds completely',
          'They release a natural pesticide',
          'Bacteria in their roots fix nitrogen from the air into a usable form',
          'They need no water',
        ],
        correctIndex: 2,
        explanation:
          'Legumes form a partnership with nitrogen-fixing bacteria in root nodules, leaving usable nitrogen behind in the soil.',
      },
      {
        question: 'Which material should NOT go into a household compost heap?',
        options: ['Dry leaves', 'Meat and bones', 'Kitchen vegetable scraps', 'Plant trimmings'],
        correctIndex: 1,
        explanation:
          'Meat, bones and oils attract pests and smell. Compost meat only in a properly managed high-temperature system, if at all.',
      },
      {
        question: 'What is the main benefit of mulching bare soil?',
        options: [
          'It kills soil organisms',
          'It removes the need for any nutrients',
          'It makes the plot look tidy',
          'It slows water loss and protects the surface from runoff and heat',
        ],
        correctIndex: 3,
        explanation:
          'Mulch moderates temperature, slows evaporation and cushions the soil surface against raindrop impact and runoff.',
      },
      {
        question: 'On a slope, why plant rows across the contour rather than up and down?',
        options: [
          'It slows runoff so water soaks in instead of carrying topsoil away',
          'It looks better from the road',
          'It lets you plant more rows',
          'It removes the need for mulch',
        ],
        correctIndex: 0,
        explanation:
          'Contour lines slow water down the slope. Rows running downhill act as channels and accelerate both erosion and water loss.',
      },
    ],
  },

  // ── Module 2 ───────────────────────────────────────────────────────────────
  {
    moduleId: 2,
    lessons: [
      {
        title: 'What on-chain governance means',
        body: [
          'In a conventional system, a decision is recorded in minutes and enforced by an institution. On a blockchain, the vote itself is the record. A proposal is submitted on chain, people vote with tokens, and the outcome is executed by the network according to the rules coded into it.',
          'BelizeChain has six districts — Belize, Cayo, Corozal, Orange Walk, Stann Creek and Toledo — and its governance pallet is built around district-level participation alongside country-wide proposals. The governance pallet also carries council seats, so some decisions are made by elected or appointed members rather than by every holder.',
          'Because every vote is a public transaction, the record is auditable by anyone. That is the point: nobody has to be trusted to report the result correctly.',
        ],
      },
      {
        title: 'Conviction voting, and why it is not free',
        body: [
          'BelizeChain uses conviction voting. Instead of one token equal to one vote with no memory, a holder can lock tokens for a period and have their vote weighted by how long they are willing to commit. Longer lock, more weight.',
          'Conviction is a trade. Locking tokens gives your opinion more influence, and in exchange you cannot spend or move those tokens while they are locked. Voting with conviction is therefore a real decision about liquidity, not a free click.',
          'This design rewards people who are prepared to stand behind an outcome, and it makes last-minute vote buying expensive, because a large weight requires a long lock rather than a quick transfer.',
        ],
      },
      {
        title: 'Voting well',
        body: [
          'Read the proposal, not the headline. Governance text is precise by necessity: what changes, when it takes effect, and what it costs. If a proposal is unclear, the honest response is to abstain, not to guess.',
          'Check who is affected. A change to fees or rewards lands differently on a small holder than on a large one. A change that looks neutral can shift costs onto people who never see the vote.',
          'Remember that a vote cast on chain is final and public. It cannot be withdrawn or hidden afterwards, and it is permanently attached to your account. Vote as if your reasoning will be read later, because it can be.',
        ],
      },
    ],
    quiz: [
      {
        question: 'How many districts does Belize have?',
        options: ['Four', 'Five', 'Six', 'Eight'],
        correctIndex: 2,
        explanation:
          'Belize has six districts: Belize, Cayo, Corozal, Orange Walk, Stann Creek and Toledo.',
      },
      {
        question: 'In conviction voting, what do you give up by locking tokens for longer?',
        options: [
          'Your right to vote at all',
          'The ability to spend or move those tokens while they are locked',
          'Your account\'s privacy',
          'Nothing — longer locks are free',
        ],
        correctIndex: 1,
        explanation:
          'Conviction buys influence with liquidity. Locked tokens cannot be spent or transferred until the lock ends.',
      },
      {
        question: 'Why does conviction voting make last-minute vote buying expensive?',
        options: [
          'Purchases are banned by the network',
          'Large voting weight requires a long lock, not a quick transfer',
          'Votes are secret',
          'It caps every account at one vote',
        ],
        correctIndex: 1,
        explanation:
          'A buyer cannot instantly acquire weight, because weight comes from commitment over time rather than token quantity alone.',
      },
      {
        question: 'A proposal you do not understand reaches a vote. What is the honest action?',
        options: [
          'Vote yes to keep things moving',
          'Vote no by default',
          'Abstain, and say why',
          'Vote yes, then complain afterwards',
        ],
        correctIndex: 2,
        explanation:
          'An uninformed vote is worse than an abstention, because it adds confidence the decision did not earn. Abstaining is a recorded, legitimate position.',
      },
    ],
  },

  // ── Module 3 ───────────────────────────────────────────────────────────────
  {
    moduleId: 3,
    lessons: [
      {
        title: 'What a blockchain actually is',
        body: [
          'A blockchain is a ledger that many independent computers keep in agreement about. Each block contains a batch of transactions plus a reference to the block before it, which is why altering an old block breaks every block after it.',
          'BelizeChain produces a block roughly every six seconds. Producing a block is not the same as finalising it: finality is the point at which a transaction can no longer be reversed without the network breaking its own rules. Waiting for finality, not just for inclusion, is the correct habit for anything that matters.',
          'You do not have to trust a single operator to read the chain. Any node can verify the record independently. That property — verification without permission — is the whole point.',
        ],
      },
      {
        title: 'Keys, addresses, and the one rule that matters',
        body: [
          'Your account is a key pair, not a username. A seed phrase (often twelve or twenty-four words) can regenerate the private half. Anyone who has it has your account, permanently, and no institution can reverse that.',
          'Addresses on BelizeChain start with r1. The chain uses SS58 prefix 1981. An address is safe to share; a seed phrase is never safe to share, never safe to photograph, and never safe to type into a website that asked for it.',
          'Each account also needs a small minimum balance to exist on chain — the existential deposit, which is 0.001 DALLA. If an account drops below it, the account is removed. That is why a new account must be funded before it can be used.',
        ],
      },
      {
        title: 'Tokens, contracts, and what "trustless" does not mean',
        body: [
          'DALLA is the native token used for fees and staking. bBZD is the unit designed to track the Belize dollar. Separately, the chain can host smart contracts — programs written in ink! and executed by the network — which can define their own tokens, rules and logic.',
          'A contract runs exactly as written. That cuts both ways. Nobody can quietly change the rules on you, and nobody can undo a mistake you made either. Sending funds to the wrong contract address is not recoverable by asking someone to intervene.',
          '"Trustless" does not mean safe. It means you do not have to trust an intermediary — you have to verify. That responsibility moves to you. Before any transaction: confirm the recipient, confirm the amount, and on anything unfamiliar, do a small test first.',
        ],
      },
    ],
    quiz: [
      {
        question: 'How long is the target block time on BelizeChain?',
        options: ['About 1 second', 'About 1 minute', 'About 10 minutes', 'About 6 seconds'],
        correctIndex: 3,
        explanation:
          'BelizeChain targets roughly six-second blocks. Block times are not the same as finality time.',
      },
      {
        question: 'What does the existential deposit mean for a new account?',
        options: [
          'The account needs a small minimum balance — 0.001 DALLA — to exist on chain',
          'You must pay a monthly fee',
          'New accounts are free and stay forever',
          'It is a tax on transfers',
        ],
        correctIndex: 0,
        explanation:
          'An account below the existential deposit is removed from state. Fund a new account before relying on it.',
      },
      {
        question: 'Someone asks for your seed phrase to "verify" your wallet. What do you do?',
        options: [
          'Send it — they are from support',
          'Send only half of it',
          'Never share it; anyone with the phrase owns the account',
          'Send it but change the password after',
        ],
        correctIndex: 2,
        explanation:
          'No legitimate service needs your seed phrase. Possession of the phrase is ownership, and no one can reverse a theft.',
      },
      {
        question: 'What does "trustless" actually require from you?',
        options: [
          'Nothing — the network protects every mistake',
          'That you verify the details yourself, because nobody can undo your error',
          'That you trust the largest validator',
          'That you use only one wallet',
        ],
        correctIndex: 1,
        explanation:
          'Trustless removes the intermediary, not the risk. Verification moves to the user, and mistakes are usually irreversible.',
      },
    ],
  },
];

/** Look up the lesson content for an on-chain module id, if we have any. */
export function getAcademyModule(moduleId: number): AcademyModule | undefined {
  return ACADEMY_MODULES.find((module) => module.moduleId === moduleId);
}

/** How many correct answers are required to pass a quiz of this length. */
export function requiredCorrect(questionCount: number): number {
  return Math.ceil(questionCount * PASS_THRESHOLD);
}
