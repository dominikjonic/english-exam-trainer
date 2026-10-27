import type { Preposition, Pronoun, PronounGap, PronounReplace } from './types';

/**
 * Own practice sentences in the style of the book (wildlife park, school,
 * family). Each gap has exactly one correct subject pronoun.
 */
export const pronounGaps: PronounGap[] = [
  { id: 'g1', text: 'Lisa is at the wildlife park. ___ likes the penguins.', answer: 'she' },
  { id: 'g2', text: 'Max and Ben are hungry. ___ want a sandwich.', answer: 'they' },
  { id: 'g3', text: 'Where is the parrot? – ___ is in the tree.', answer: 'it' },
  { id: 'g4', text: 'Are you tired, Emma? – Yes, ___ am.', answer: 'I' },
  { id: 'g5', text: 'Paul, ___ are late again!', answer: 'you' },
  { id: 'g6', text: 'This is Mr Green. ___ is our guide today.', answer: 'he' },
  { id: 'g7', text: 'The giraffes are very tall. ___ eat leaves.', answer: 'they' },
  { id: 'g8', text: 'Look at this stone! ___ is very big.', answer: 'it' },
  { id: 'g9', text: 'Hello, Mia and Leo! How are ___?', answer: 'you' },
  { id: 'g10', text: 'Sarah and I are in Year 6. ___ are in the same class.', answer: 'we' },
  { id: 'g11', text: 'The lion is tired. ___ sleeps under the tree.', answer: 'it' },
  { id: 'g12', text: 'Grandma has got a garden. ___ feeds the birds every morning.', answer: 'she' },
  { id: 'g13', text: '___ am eleven years old.', answer: 'I' },
  { id: 'g14', text: 'Are the monkeys happy? – Yes, ___ are.', answer: 'they' },
  { id: 'g15', text: "Is the train red? – No, ___ isn't. It's blue.", answer: 'it' },
  { id: 'g16', text: "Is Tom at home? – No, ___ isn't.", answer: 'he' },
  { id: 'g17', text: 'Is Anna your sister? – Yes, ___ is.', answer: 'she' },
  { id: 'g18', text: 'Are you and Jack friends? – Yes, ___ are.', answer: 'we' },
  { id: 'g19', text: 'Mum and Dad are in the car. ___ talk about the zoo.', answer: 'they' },
  { id: 'g20', text: 'Jake has got a new bike. ___ is green.', answer: 'it' },
  { id: 'g21', text: 'My new jeans are great. ___ are blue.', answer: 'they' },
  { id: 'g22', text: 'Ella, ___ are my best friend.', answer: 'you' },
  { id: 'g23', text: 'Our guide is a woman. ___ is very nice.', answer: 'she' },
  { id: 'g24', text: 'Look at the penguin! ___ is in the water.', answer: 'it' },
  { id: 'g25', text: 'Oscar is from London. ___ likes football.', answer: 'he' },
  { id: 'g26', text: "I've got two cats. ___ are black and white.", answer: 'they' },
  { id: 'g27', text: 'You and Ben are in the team. ___ play on Saturday, okay?', answer: 'you' },
  { id: 'g28', text: 'Lucy and I are at the zoo. ___ feed the goats.', answer: 'we' },
  { id: 'g29', text: 'Where is Dad? – ___ is in the garden.', answer: 'he' },
  { id: 'g30', text: 'Hello, my name is Kim. ___ am new here.', answer: 'I' },
  { id: 'g31', text: 'My sister and her friend are at the park. ___ run around.', answer: 'they' },
  { id: 'g32', text: 'Is the giraffe big? – Yes, ___ is very big!', answer: 'it' },
  { id: 'g33', text: 'Mrs Brown is my teacher. ___ is from Scotland.', answer: 'she' },
  { id: 'g34', text: 'Can ___ come to my party, Sam? – Yes, of course!', answer: 'you' },
  { id: 'g35', text: 'Ben, Leo and I are a team. ___ always win.', answer: 'we' },
  { id: 'g36', text: 'My grandpa is 80. ___ still rides his bike.', answer: 'he' },
  { id: 'g37', text: 'Are you okay, Tim? – No, ___ am not. My leg hurts.', answer: 'I' },
];

export const pronounReplaces: PronounReplace[] = [
  { id: 'r1', phrase: 'Tom and I', rest: 'are at the zoo.', answer: 'we' },
  { id: 'r2', phrase: 'The penguins', rest: 'swim in the water.', answer: 'they' },
  { id: 'r3', phrase: 'Lisa', rest: 'likes parrots.', answer: 'she' },
  { id: 'r4', phrase: 'The train', rest: 'is very long.', answer: 'it' },
  { id: 'r5', phrase: 'Mr Smith', rest: 'is the guide.', answer: 'he' },
  { id: 'r6', phrase: 'You and Anna', rest: 'are late.', answer: 'you' },
  { id: 'r7', phrase: 'My mum', rest: 'feeds the cat.', answer: 'she' },
  { id: 'r8', phrase: 'The lion', rest: 'is behind the tree.', answer: 'it' },
  { id: 'r9', phrase: 'Ben and his dad', rest: 'talk about cars.', answer: 'they' },
  { id: 'r10', phrase: 'My friends and I', rest: 'run around.', answer: 'we' },
  { id: 'r11', phrase: 'The stone', rest: 'is under the table.', answer: 'it' },
  { id: 'r12', phrase: 'Grandpa', rest: 'is in the garden.', answer: 'he' },
  { id: 'r13', phrase: 'The monkeys', rest: 'are happy.', answer: 'they' },
  { id: 'r14', phrase: 'Emma and I', rest: 'are in Year 6.', answer: 'we' },
  { id: 'r15', phrase: 'The car', rest: 'is in front of the house.', answer: 'it' },
  { id: 'r16', phrase: 'Jack', rest: 'is from Manchester.', answer: 'he' },
  { id: 'r17', phrase: 'Sophie and Mia', rest: 'are best friends.', answer: 'they' },
  { id: 'r18', phrase: 'Aunt Julia', rest: 'has got a parrot.', answer: 'she' },
  { id: 'r19', phrase: 'The guide and I', rest: 'feed the lions.', answer: 'we' },
  { id: 'r20', phrase: 'The giraffe', rest: 'eats leaves.', answer: 'it' },
];

export const pronouns: Pronoun[] = ['I', 'you', 'he', 'she', 'it', 'we', 'they'];

export const prepositions: Preposition[] = ['in', 'on', 'under', 'next to', 'behind', 'in front of'];

export const prepositionDe: Record<Preposition, string> = {
  in: 'in',
  on: 'auf',
  under: 'unter',
  'next to': 'neben',
  behind: 'hinter',
  'in front of': 'vor',
};

export interface Animal {
  id: string;
  en: string;
  plural: string;
  de: string;
  emoji: string;
}

export const animals: Animal[] = [
  { id: 'cat', en: 'cat', plural: 'cats', de: 'die Katze', emoji: '🐱' },
  { id: 'parrot', en: 'parrot', plural: 'parrots', de: 'der Papagei', emoji: '🦜' },
  { id: 'monkey', en: 'monkey', plural: 'monkeys', de: 'der Affe', emoji: '🐒' },
  { id: 'penguin', en: 'penguin', plural: 'penguins', de: 'der Pinguin', emoji: '🐧' },
  { id: 'dog', en: 'dog', plural: 'dogs', de: 'der Hund', emoji: '🐶' },
  { id: 'lion', en: 'lion', plural: 'lions', de: 'der Löwe', emoji: '🦁' },
];

export type SceneObject = 'box' | 'table';

export const objectNames: Record<SceneObject, { en: string; de: string; dat: string }> = {
  box: { en: 'box', de: 'die Kiste', dat: 'der Kiste' },
  table: { en: 'table', de: 'der Tisch', dat: 'dem Tisch' },
};

/** Which prepositions make sense with which object. */
export const objectPreps: Record<SceneObject, Preposition[]> = {
  box: ['in', 'on', 'next to', 'behind', 'in front of'],
  table: ['on', 'under', 'next to', 'behind', 'in front of'],
};

export const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five'];
