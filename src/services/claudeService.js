const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

export async function mapVoiceToOption(transcript) {
    // ── Fallback local rápido para respuestas obvias ──
    const t = transcript.toLowerCase().trim();
    const localMap = {
        'uno': 1, '1': 1, 'certificado': 1, 'certificado de alumno': 1, 'certificado de alumno regular': 1,
        'dos': 2, '2': 2, 'progreso': 2, 'progreso académico': 2, 'progreso academico': 2, 'notas': 2, 'malla': 2,
        'tres': 3, '3': 3, 'horario': 3, 'ver horario': 3, 'horario académico': 3, 'horario academico': 3, 'clases': 3,
        'cuatro': 4, '4': 4, 'situación financiera': 4, 'situacion financiera': 4, 'pagos': 4, 'deuda': 4, 'beca': 4,
        'cero': 0, '0': 0, 'asesor': 0, 'hablar con alguien': 0, 'ayuda': 0,
    };
    if (localMap[t] !== undefined) {
        console.log(`[VOZ LOCAL] "${t}" → opción ${localMap[t]}`);
        return localMap[t];
    }

    if (!CLAUDE_API_KEY) {
        console.error('VITE_CLAUDE_API_KEY no está configurada');
        return null;
    }

    const systemPrompt = `Eres el sistema de un tótem universitario DUOC UC.
El usuario habló para seleccionar una opción del menú.
Opciones disponibles:
0 = quiere hablar con asesor, atención personal, ayuda humana
1 = certificado de alumno regular, certificado, papel, documento
2 = progreso académico, notas, avance, malla, promedio, calificaciones
3 = ver horario, horario académico, clases, horario, cuando tengo clases
4 = situación financiera, pagos, deuda, beca, aranceles, dinero
El usuario dijo: "${transcript}"
Analiza el contexto y responde ÚNICAMENTE con el número 0, 1, 2, 3 o 4.
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
                model: 'claude-sonnet-4-20250514',
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
