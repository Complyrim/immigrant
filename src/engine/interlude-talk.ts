import type { Role } from './types';

/**
 * What people say out loud during an evening between tasks. Each activity has a couple of short
 * conversations; one is picked per evening and played as speech bubbles over the people while the
 * scene's narration runs in the dialogue box. Lines stay general enough to fit any of the activity's
 * scripts. Every speaker is someone in that activity's cast.
 */
export interface SpokenLine {
  who: Role;
  text: string;
}

export const INTERLUDE_TALK: Record<string, SpokenLine[][]> = {
  sleep: [
    [{ who: 'player', text: 'No alarm tomorrow. Not one.' }, { who: 'player', text: 'Five more minutes. Maybe fifty.' }],
    [{ who: 'player', text: 'Everything else can wait until morning.' }, { who: 'player', text: 'Okay. Sleep. Now.' }],
  ],
  cook: [
    [
      { who: 'roommate', text: 'What is that smell? Whatever it is, I want some.' },
      { who: 'player', text: 'Something from home. Grab a plate.' },
      { who: 'roommate', text: 'You have to teach me this one.' },
      { who: 'player', text: 'Next time. Chop the onions and you are in.' },
    ],
    [
      { who: 'player', text: 'Taste this. Does it need more salt?' },
      { who: 'roommate', text: 'It needs nothing. Is there more?' },
      { who: 'player', text: 'There is always more. That is the rule at home.' },
    ],
  ],
  rooftop: [
    [
      { who: 'friend', text: 'Okay, worst moment of your first month. Go.' },
      { who: 'player', text: 'I tipped the bus driver. He just stared at me.' },
      { who: 'student', text: 'That is nothing. I called my landlord Mom.' },
      { who: 'friend', text: 'Nobody leaves until the sky goes dark.' },
    ],
    [
      { who: 'student', text: 'You can see the whole city from up here.' },
      { who: 'player', text: 'It looks smaller from up here. Friendlier.' },
      { who: 'friend', text: 'Same time next week? I will bring the snacks.' },
    ],
  ],
  club: [
    [
      { who: 'friend', text: 'This song! You have to dance to this one.' },
      { who: 'player', text: 'I do not know the moves here.' },
      { who: 'student', text: 'Nobody does. That is the secret.' },
    ],
    [
      { who: 'student', text: 'Is this the song from your country?' },
      { who: 'player', text: 'Close enough. Louder, though.' },
      { who: 'friend', text: 'One more song, then we find food.' },
    ],
  ],
  gym: [
    [
      { who: 'friend', text: 'Three more. You have three more in you.' },
      { who: 'player', text: 'I have maybe one more in me.' },
      { who: 'friend', text: 'One is a start. Same time Thursday?' },
    ],
    [
      { who: 'player', text: 'Why does everyone here look like they live in the gym?' },
      { who: 'friend', text: 'Half of them do. Water break?' },
    ],
  ],
  walk: [
    [
      { who: 'friend', text: 'Left or right? I have never been down that street.' },
      { who: 'player', text: 'Left. It smells like bread.' },
      { who: 'friend', text: 'Good call. We are getting some.' },
    ],
    [
      { who: 'player', text: 'I still get lost if I turn around too fast.' },
      { who: 'friend', text: 'Getting lost is how you learn a city.' },
    ],
  ],
  'call-home': [
    [
      { who: 'parent', text: 'Are you eating properly? You look thin.' },
      { who: 'player', text: 'I am eating. I cooked tonight, actually.' },
      { who: 'parent', text: 'Show me the kitchen. Is it clean?' },
      { who: 'player', text: 'Cleaner than my room ever was.' },
    ],
    [
      { who: 'parent', text: 'Everyone here asks about you.' },
      { who: 'player', text: 'Tell them I am fine. Better than fine.' },
      { who: 'parent', text: 'Call again on Sunday. Promise me.' },
    ],
  ],
  // A call with a sibling: the sibling is the second person on screen (cast as 'student').
  'call-home-sibling': [
    [
      { who: 'student', text: 'Finally! Mom said you would never call me first.' },
      { who: 'player', text: 'I am calling you first right now. Tell her that.' },
      { who: 'student', text: 'Your old room is mine now, by the way.' },
      { who: 'player', text: 'Keep it clean. I am coming back to visit.' },
    ],
    [
      { who: 'student', text: 'You sound different. Your accent is changing.' },
      { who: 'player', text: 'It is not. Okay, maybe a little.' },
      { who: 'student', text: 'Everyone misses you. Even the dog.' },
    ],
  ],
  library: [
    [
      { who: 'friend', text: 'Quiz me. Chapter four, the hard part.' },
      { who: 'player', text: 'Okay. And if you get it wrong, you buy coffee.' },
      { who: 'friend', text: 'Then I am already buying coffee.' },
    ],
    [
      { who: 'player', text: 'One more hour, then we stop.' },
      { who: 'friend', text: 'You said that an hour ago.' },
    ],
  ],
  movie: [
    [
      { who: 'roommate', text: 'Subtitles on or off?' },
      { who: 'player', text: 'On. I still miss half the jokes.' },
      { who: 'friend', text: 'I miss half of them too, and I grew up here.' },
    ],
    [
      { who: 'friend', text: 'Who brought the popcorn? Hero.' },
      { who: 'roommate', text: 'No talking during the good part.' },
      { who: 'player', text: 'Which part is the good part?' },
    ],
  ],
  coffee: [
    [
      { who: 'friend', text: 'So, honestly. How are you doing?' },
      { who: 'player', text: 'Tired. Good tired, mostly.' },
      { who: 'friend', text: 'Mostly is a good word. I will take mostly.' },
    ],
    [
      { who: 'player', text: 'Why is a small coffee here the size of a bucket?' },
      { who: 'friend', text: 'Welcome to America. Want to split a pastry?' },
    ],
  ],
  park: [
    [
      { who: 'friend', text: 'This is the best bench in the whole park.' },
      { who: 'player', text: 'You say that about every bench.' },
      { who: 'friend', text: 'And I am right every time.' },
    ],
    [
      { who: 'player', text: 'People here walk their dogs like they are children.' },
      { who: 'friend', text: 'Some of those dogs eat better than I do.' },
    ],
  ],
  'campus-event': [
    [
      { who: 'student', text: 'Free food at the back. Go before it is gone.' },
      { who: 'friend', text: 'Over here! We saved you a spot.' },
      { who: 'player', text: 'I did not expect this many people.' },
    ],
    [
      { who: 'friend', text: 'Is there a table for your country?' },
      { who: 'player', text: 'There is, and they gave me a flag.' },
      { who: 'student', text: 'Come to our meeting next week. Bring a friend.' },
    ],
  ],
  neighbors: [
    [
      { who: 'friend', text: 'You are the new one in 4B, right?' },
      { who: 'player', text: 'That is me. Still learning the stairs.' },
      { who: 'friend', text: 'The elevator is worse. Come by for tea sometime.' },
    ],
    [
      { who: 'friend', text: 'If the heat goes out, knock on my door.' },
      { who: 'player', text: 'Thank you. I will return the favor.' },
    ],
  ],
  'quiet-hour': [
    [{ who: 'player', text: 'No phone. Just this, for an hour.' }, { who: 'player', text: 'It is quieter than I thought it could be here.' }],
    [{ who: 'player', text: 'Breathe in. Breathe out. Again.' }, { who: 'player', text: 'I needed this more than I knew.' }],
  ],
  'dating-app': [
    [{ who: 'player', text: 'Loves hiking, loves dogs. Everyone loves dogs.' }, { who: 'player', text: 'Okay, this one is funny. Say hello.' }],
    [{ who: 'player', text: 'What do I even write about myself?' }, { who: 'player', text: 'New in town. Good cook. That will do.' }],
  ],
  'first-date': [
    [
      { who: 'partner', text: 'So what made you pick this city?' },
      { who: 'player', text: 'It picked me, sort of. I will tell you the long version.' },
      { who: 'partner', text: 'I have time. Tell me the long version.' },
    ],
    [
      { who: 'player', text: 'I practiced what to say, and now I forget all of it.' },
      { who: 'partner', text: 'Good. This is better than practiced.' },
    ],
  ],
  'date-night': [
    [
      { who: 'partner', text: 'Close your eyes. I brought you something.' },
      { who: 'player', text: 'Is it food? Please say it is food.' },
      { who: 'partner', text: 'It is food. I know you.' },
    ],
    [
      { who: 'player', text: 'I love the city at night.' },
      { who: 'partner', text: 'I love it more with you in it.' },
    ],
  ],
  kiss: [
    [
      { who: 'partner', text: 'I do not want tonight to end.' },
      { who: 'player', text: 'Then let us walk the long way home.' },
    ],
    [
      { who: 'player', text: 'Can I tell you something?' },
      { who: 'partner', text: 'Anything.' },
      { who: 'player', text: 'I am really glad I came here.' },
    ],
  ],
  'night-together': [
    [
      { who: 'partner', text: 'Stay. We can order food and do nothing.' },
      { who: 'player', text: 'Doing nothing sounds perfect.' },
    ],
    [
      { who: 'player', text: 'Tell me about your family.' },
      { who: 'partner', text: 'Only if you tell me about yours.' },
    ],
  ],
  rideshare: [
    [
      { who: 'stranger', text: 'Where are you from, if you do not mind me asking?' },
      { who: 'player', text: 'Not at all. A long way from here.' },
      { who: 'stranger', text: 'You are doing better than I would. Keep the change.' },
    ],
    [
      { who: 'player', text: 'Evening. Heading downtown?' },
      { who: 'stranger', text: 'Yes, and take your time. It has been a long day.' },
    ],
  ],
};
