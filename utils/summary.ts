import { Caption } from '@/hooks/useWebRTC';

export interface MeetingSummary {
  participants: string[];
  totalSpeakingTurns: number;
  keySentences: { speaker: string; text: string }[];
}

export function generateMeetingSummary(captions: Caption[]): MeetingSummary {
  if (!captions || captions.length === 0) {
    return {
      participants: [],
      totalSpeakingTurns: 0,
      keySentences: [],
    };
  }

  // 1. Extract Unique Participants
  const participantsSet = new Set<string>();
  captions.forEach(c => participantsSet.add(c.speaker));

  // 2. Total speaking turns is just the length of captions array
  const totalSpeakingTurns = captions.length;

  // 3. Extract Key Sentences
  // Simple heuristic: 
  // - Look for questions (ending in "?")
  // - Look for action words or sentiment words
  // - Or sentences longer than 50 characters (meaningful contribution)
  const keywords = ['decide', 'implement', 'create', 'should', 'action', 'important', 'need', 'must', 'plan', 'next steps', 'architect', 'deploy'];
  
  const keySentences = captions.filter(c => {
    const textLower = c.text.toLowerCase();
    
    // Is it a question?
    if (c.text.trim().endsWith('?')) return true;
    
    // Does it contain a keyword?
    if (keywords.some(kw => textLower.includes(kw))) return true;
    
    // Is it a substantive long sentence?
    if (c.text.length > 80) return true;
    
    return false;
  });

  // If we found too many key sentences, just return the most relevant or longest ones (cap at 10 for readability)
  const limitedKeySentences = keySentences
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 10);

  return {
    participants: Array.from(participantsSet),
    totalSpeakingTurns,
    keySentences: limitedKeySentences,
  };
}
