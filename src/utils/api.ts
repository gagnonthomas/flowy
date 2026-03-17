/**
 * Anthropic API — appel direct comme dans le prototype web.
 *
 * Pour le dev : mettre ta clé dans .env.local :
 *   EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
 *
 * Pour la production : migrer vers un Cloudflare Worker
 * qui garde la clé côté serveur.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';

interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ApiResponse {
  text: string;
  error?: string;
}

async function callAnthropic(
  messages: ApiMessage[],
  options: { system?: string; maxTokens?: number; model?: string } = {}
): Promise<ApiResponse> {
  const { system, maxTokens = 600, model = 'claude-sonnet-4-5' } = options;

  if (!API_KEY) {
    return { text: '', error: 'Clé API manquante. Ajoute EXPO_PUBLIC_ANTHROPIC_API_KEY dans .env.local' };
  }

  try {
    const body: any = {
      model,
      max_tokens: maxTokens,
      messages,
    };
    if (system) body.system = system;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = (data.content || []).map((b: any) => b.text || '').join('').trim();
    return { text };
  } catch (e) {
    console.error('Anthropic API error:', e);
    return { text: '', error: String(e) };
  }
}

// ── Coach chat ──
export async function sendCoachMessage(history: ApiMessage[]): Promise<string> {
  const system = `Tu es Flowi, le coach personnel de l'utilisateur dans l'application Flowi. Tu es chaleureux, bienveillant et spécialisé en productivité, organisation et bien-être mental — avec une expertise pour les cerveaux qui fonctionnent différemment. Tu tutoies toujours l'utilisateur. Tu parles avec naturel, comme un ami de confiance qui s'y connaît. Tes réponses sont courtes et ciblées — jamais de pavés, jamais de listes à n points. Tu vas à l'essentiel. Avant de conseiller, tu reconnais l'état de la personne. Si elle est épuisée, tu adaptes. Si elle est dans le flow, tu amplifies. Tu célèbres les petites victoires sans exagérer. Tu ne juges jamais. Tu sais que la productivité n'est pas une question de volonté, chaque cerveau fonctionne à sa façon. Tu proposes toujours des actions concrètes, micro, réalisables maintenant. Quand tu reçois des données (énergie, tâches, humeur, sommeil), tu les utilises pour personnaliser ta réponse sans les lister mécaniquement. Maximum 150 mots. Écris toujours en français.`;

  const { text, error } = await callAnthropic(history, { system, maxTokens: 600 });
  return text || (error ? `Désolé, je n'arrive pas à me connecter. ${error.includes('Clé API') ? error : 'Réessaie dans un moment !'}` : '');
}

// ── Pensée du jour (oracle) ──
export async function fetchOracle(): Promise<string> {
  const { text } = await callAnthropic(
    [{ role: 'user', content: "Donne-moi une pensée inspirante et bienveillante pour la journée. Une seule phrase, poétique et encourageante. En français. Pas de guillemets, pas d'attribution." }],
    { system: 'Tu es Flowi, un coach bienveillant. Tu produis des pensées du jour courtes, poétiques et encourageantes. En français.', maxTokens: 100 }
  );
  return text;
}

// ── Plan du jour ──
export async function generateDayPlan(
  date: string, energy: string, tasks: string
): Promise<{ message: string; focus: string | null; suggestions: any[]; conseil: string | null }> {
  const { text } = await callAnthropic(
    [{ role: 'user', content: `Aujourd'hui: ${date}. Énergie: ${energy}.\n\nTâches:\n${tasks}\n\nRéponds UNIQUEMENT avec du JSON valide, sans markdown.\nFormat: {"message":"encouragement court","focus":"1 tâche prioritaire","suggestions":[{"type":"faire","task":"nom","raison":"raison courte"}],"conseil":"conseil court"}` }],
    { system: 'Tu es Flowi, coach chaleureux spécialisé en productivité. Tu tutoies toujours. En français.', maxTokens: 1000 }
  );
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : clean);
  } catch {
    return { message: "Oups, une erreur s'est produite. Réessaie.", focus: null, suggestions: [], conseil: null };
  }
}

// ── Décomposer une tâche ──
export async function decomposeTask(
  taskText: string
): Promise<{ intro: string; steps: { label: string; dur: string; emoji: string }[] }> {
  const { text } = await callAnthropic(
    [{ role: 'user', content: taskText }],
    {
      system: "Tu es Flowi, coach bienveillant spécialisé en productivité et flow. Quand on te donne une tâche, décompose-la en 4-6 étapes très courtes, concrètes et immédiatement actionnables. Chaque étape doit prendre moins de 15 minutes. Réponds UNIQUEMENT en JSON valide. Format: {\"intro\":\"phrase courte naturelle (max 15 mots)\",\"steps\":[{\"label\":\"action concrète\",\"dur\":\"durée estimée\",\"emoji\":\"emoji\"}]}. Tu tutoies toujours. En français.",
      maxTokens: 800,
    }
  );
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { intro: '', steps: [] };
  }
}

// ── Brain dump (organiser) ──
export async function organizeBrainDump(
  dump: string, date: string, energy: string, existingTasks: string
): Promise<{ resume: string; blocs: any[]; conseil: string }> {
  const { text } = await callAnthropic(
    [{ role: 'user', content: `Date : ${date}. Niveau d'énergie : ${energy}. Tâches existantes : ${existingTasks}.\n\nVoici le vide-cerveau :\n${dump}\n\nOrganise en horaire structuré. Pour chaque tâche, décompose en sous-tâches. Réponds UNIQUEMENT en JSON valide sans markdown. Format:\n{"resume":"phrase courte (max 15 mots)","blocs":[{"heure":"9h00","titre":"Nom","duree":"30 min","priorite":"urgente|haute|normale|basse","emoji":"emoji","sousTaches":["sous-tâche 1","sous-tâche 2"]}],"conseil":"conseil de flow (max 25 mots)"}` }],
    {
      system: 'Tu es Flowi, coach chaleureux spécialisé en productivité, flow et bien-être. Tu tutoies toujours. En français.',
      maxTokens: 1500,
    }
  );
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { resume: '', blocs: [], conseil: '' };
  }
}

// ── Guidance méditation ──
export async function fetchMeditationGuidance(
  duration: number, type: string, energy: string
): Promise<string> {
  const { text } = await callAnthropic(
    [{ role: 'user', content: `Je vais faire une méditation de ${duration} minutes de type ${type}. Mon énergie aujourd'hui : ${energy}.\n\nÉcris une courte guidance de démarrage (3-5 phrases max) pour m'aider à commencer. Commence par m'inviter à m'installer confortablement. Adapte le ton à mon énergie. Pas de titre, juste le texte de guidance.` }],
    { system: 'Tu es Flowi, coach bienveillant. Tu guides des séances de méditation courtes et accessibles. Ton ton est doux, chaleureux, sans jargon. Tu tutoies toujours. En français.', maxTokens: 300 }
  );
  return text;
}
