const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

export async function mapVoiceToOption(transcript) {
    // ── Fallback local rápido para respuestas obvias ──
    const t = transcript.toLowerCase().trim();
    if (t.includes('horario') || t.includes('clase') || t.includes('cuando tengo') || t.includes('asignatura')) return 1;
    if (t.includes('certificado') || t.includes('alumno regular') || t.includes('papel')) return 2;
    if (t.includes('asesor') || t.includes('alguien') || t.includes('ayuda') || t.includes('persona')) return 0;

    if (!CLAUDE_API_KEY) {
        console.error('VITE_CLAUDE_API_KEY no está configurada');
        return null;
    }

    const systemPrompt = `Eres el sistema de un tótem universitario DUOC UC.
El usuario habló para seleccionar una opción del menú.
Opciones disponibles:
0 = quiere hablar con asesor, atención personal, ayuda humana
1 = ver horario, horario académico, clases, horario, cuando tengo clases
2 = certificado de alumno regular, certificado, papel, documento
El usuario dijo: "${transcript}"
Analiza el contexto y responde ÚNICAMENTE con el número 0, 1 o 2.
Solo el número. Nada más.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 10,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: `El usuario respondió: "${transcript}"`
                    }
                ]
            })
        });

        if (!response.ok) {
            console.error('Error en Claude API:', response.status);
            return null;
        }

        const data = await response.json();
        const num = parseInt(data.content[0].text.trim());
        return (num >= 0 && num <= 4) ? num : null;
    } catch (error) {
        console.error('Error llamando a Claude:', error);
        return null;
    }
}

export async function mapVoiceToAsesorSubOption(transcript) {
    const t = transcript.toLowerCase().trim();
    
    // Fallback Local Rápido
    if (t.includes('académico') || t.includes('academico') || t.includes('1') || t.includes('uno')) return 'ACA';
    if (t.includes('práctica') || t.includes('practica') || t.includes('2') || t.includes('dos')) return 'PRA';
    if (t.includes('inclusión') || t.includes('inclusion') || t.includes('3') || t.includes('tres')) return 'INC';
    if (t.includes('financiero') || t.includes('finanza') || t.includes('pagos') || t.includes('4') || t.includes('cuatro')) return 'FIN';

    // Fallback a Claude
    if (!CLAUDE_API_KEY) return null;

    const systemPrompt = `Eres el sistema de un tótem universitario DUOC UC en el sub-menú de asesores.
El usuario debe elegir el área de atención.
Opciones:
ACA = Académico, notas, convalidaciones
PRA = Práctica, título, portafolio
INC = Inclusión, necesidades especiales
FIN = Financiero, pagos, becas, deudas
El usuario dijo: "${transcript}"
Responde ÚNICAMENTE con el código de 3 letras (ACA, PRA, INC o FIN). Nada más.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 10,
                system: systemPrompt,
                messages: [{ role: 'user', content: `El usuario dijo: "${transcript}"` }]
            })
        });

        if (!response.ok) return null;

        const data = await response.json();
        const code = data.content[0].text.trim().toUpperCase();
        return ['ACA', 'PRA', 'INC', 'FIN'].includes(code) ? code : null;
    } catch (error) {
        return null;
    }
}
