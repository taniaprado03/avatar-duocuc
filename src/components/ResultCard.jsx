/* ─── ResultCard: per-tramite professional display in Tailwind Vanguard UI ─── */
import { useEffect } from 'react';
import { sendCertificadoEmail, sendFinancieroEmail } from '../services/emailService';
import { ShieldCheck } from 'lucide-react';

const ESTUDIANTE = {
    nombre: 'Tania Rodríguez',
    rut: '20.123.456-7',
    carrera: 'Ing. en Informática',
    sede: 'San Bernardo',
};

/* ─── 1: Certificado de Alumno Regular ─── */
function CertificadoCard({ userData }) {
    // Si viene la data del login facial real, usamos esos
    const nombreUsuario = userData?.nombre || ESTUDIANTE.nombre;

    useEffect(() => {
        if (userData) {
            sendCertificadoEmail(userData);
        }
    }, [userData]);

    const rows = [
        { label: 'Documento', value: 'Certificado de Alumno Regular' },
        { label: 'Estudiante', value: nombreUsuario },
        { label: 'RUT', value: ESTUDIANTE.rut },
        { label: 'Carrera', value: ESTUDIANTE.carrera },
        { label: 'Sede', value: ESTUDIANTE.sede },
        { label: 'Vigencia', value: 'Semestre 1 - 2026' },
        { label: 'Estado', value: 'ACTIVO' },
    ];

    return (
        <div className="a11y-inner-card w-full max-w-3xl bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-bl-[2rem] font-black text-[18px] shadow-lg tracking-wider">
                ✓ GENERADO
            </div>

            <h3 className="text-4xl font-black text-white mb-8 border-b-2 border-white/20 pb-6 drop-shadow-md">Detalle del Certificado</h3>

            <div className="flex flex-col gap-6">
                {rows.map(({ label, value }) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/10 last:border-0" key={label}>
                        <span className="text-white/70 text-[20px] font-bold uppercase tracking-widest">{label}</span>
                        <span className={`text-[26px] font-black ${label === 'Estado' ? 'text-green-400 drop-shadow-sm' : 'text-white'}`}>{value}</span>
                    </div>
                ))}
            </div>

            {userData && (
                <div className="mt-10 flex items-center justify-center gap-4 bg-green-500/20 text-green-300 px-8 py-6 rounded-[2rem] border-2 border-green-500/30 mb-4 shadow-inner">
                    <span className="text-[22px] font-bold animate-pulse text-center leading-relaxed">Este documento ha sido enviado exitosamente al correo: <br/><span className="text-white text-[24px] font-black">{userData.correo}</span></span>
                </div>
            )}

            <div className="mt-8 text-center text-[16px] text-white/50 uppercase tracking-widest bg-black/20 py-4 rounded-2xl border border-white/10 font-bold">
                Documento válido Oficialmente — Sede {ESTUDIANTE.sede} · {new Date().toLocaleDateString('es-CL')}
            </div>
        </div>
    );
}

/* ─── 2: Horario Académico ─── */
const HORARIO = [
    { dia: 'Lunes', hora: '08:30–10:00', asignatura: 'Programación III', sala: 'L4-A' },
    { dia: 'Martes', hora: '10:15–11:45', asignatura: 'Redes y Comunicac.', sala: 'A2-14' },
    { dia: 'Miércoles', hora: '08:30–10:00', asignatura: 'Base de Datos', sala: 'L3-B' },
    { dia: 'Jueves', hora: '13:00–14:30', asignatura: 'Ingeniería de SW.', sala: 'B1-01' },
    { dia: 'Viernes', hora: '10:15–11:45', asignatura: 'Ética Profesional', sala: 'A1-08' },
];

function HorarioCard() {
    return (
        <div className="a11y-inner-card w-full max-w-5xl bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="bg-white/10 px-12 py-8 border-b-2 border-white/20 backdrop-blur-md">
                <h3 className="text-[42px] font-black text-white drop-shadow-md">Tu Horario Académico</h3>
                <p className="text-duoc-yellow text-[20px] font-black mt-2 uppercase tracking-widest">Semestre 1 - 2026</p>
            </div>
            <div className="overflow-x-auto p-6">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-white/60 uppercase text-[18px] tracking-widest border-b-2 border-white/20">
                            {['Día', 'Hora', 'Asignatura', 'Sala'].map(h => (
                                <th key={h} className="px-8 py-6 font-black">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {HORARIO.map((row, i) => (
                            <tr key={i} className="hover:bg-white/10 transition-colors group">
                                <td className="px-8 py-6 text-white font-black text-[24px] group-hover:text-duoc-yellow transition-colors">{row.dia}</td>
                                <td className="px-8 py-6 text-white/80 font-mono font-bold text-[22px]">{row.hora}</td>
                                <td className="px-8 py-6 text-white font-black text-[24px] drop-shadow-sm">{row.asignatura}</td>
                                <td className="px-8 py-6">
                                    <span className="inline-block bg-white/20 text-white font-black px-6 py-3 rounded-2xl text-[20px] backdrop-blur-md border border-white/20 shadow-inner">
                                        {row.sala}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ─── 3: Progreso Académico ─── */
const ASIGNATURAS = [
    { nombre: 'Programación III', nota: 6.2, creditos: 5 },
    { nombre: 'Redes y Comunicac.', nota: 5.8, creditos: 4 },
    { nombre: 'Base de Datos', nota: 6.5, creditos: 5 },
    { nombre: 'Ingeniería de SW.', nota: 5.4, creditos: 4 },
    { nombre: 'Ética Profesional', nota: 6.8, creditos: 2 },
];
const PROMEDIO = (ASIGNATURAS.reduce((s, a) => s + a.nota * a.creditos, 0) /
    ASIGNATURAS.reduce((s, a) => s + a.creditos, 0)).toFixed(1);

function ProgresoCard() {
    return (
        <div className="a11y-inner-card w-full max-w-4xl bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-[2.5rem] p-12 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-10 pb-8 border-b-2 border-white/20 gap-8">
                <div>
                    <h3 className="text-[42px] font-black text-white drop-shadow-md">Progreso Académico</h3>
                    <p className="text-white/70 text-[22px] font-bold mt-2">Rendimiento actual ponderado</p>
                </div>
                <div className="flex items-center gap-6 bg-black/30 px-10 py-6 rounded-[2.5rem] border-2 border-white/10 shadow-inner">
                    <span className="text-white/60 uppercase tracking-widest text-[18px] font-black">Promedio</span>
                    <span className="text-[4rem] leading-none font-black text-white drop-shadow-2xl">{PROMEDIO}</span>
                </div>
            </div>

            <div className="flex flex-col gap-10">
                {ASIGNATURAS.map(({ nombre, nota, creditos }) => {
                    const pct = ((nota / 7) * 100).toFixed(0);
                    const colorClass = nota >= 6.0 ? 'text-green-400' : nota >= 5.0 ? 'text-duoc-yellow' : 'text-red-400';
                    const bgClass = nota >= 6.0 ? 'bg-green-500' : nota >= 5.0 ? 'bg-duoc-yellow' : 'bg-red-500';

                    return (
                        <div className="flex flex-col gap-4" key={nombre}>
                            <div className="flex justify-between items-end">
                                <span className="text-white font-black text-[28px] leading-tight drop-shadow-sm">{nombre}</span>
                                <div className="flex items-baseline gap-5">
                                    <span className={`text-[36px] font-black drop-shadow-md ${colorClass}`}>{nota.toFixed(1)}</span>
                                    <span className="text-[18px] text-white/50 uppercase font-black tracking-widest">{creditos} cr.</span>
                                </div>
                            </div>
                            <div className="w-full h-6 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
                                <div className={`h-full ${bgClass} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%`, boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── 4: Situación Financiera (PRIVADA) ─── */
function FinancieroCard({ userData }) {
    useEffect(() => {
        if (userData) {
            sendFinancieroEmail(userData);
        }
    }, [userData]);

    return (
        <div className="a11y-inner-card w-full max-w-3xl bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-[2.5rem] p-12 shadow-2xl text-center flex flex-col items-center">
            <div className="bg-green-500/20 text-green-400 rounded-[2.5rem] w-36 h-36 flex items-center justify-center mb-10 shadow-inner border-2 border-green-500/30">
                <ShieldCheck size={72} />
            </div>
            <h3 className="text-[48px] font-black text-white mb-8 drop-shadow-md">¡Detalle Enviado!</h3>
            <p className="text-[22px] text-white/90 mb-12 max-w-2xl leading-relaxed font-bold">
                Por motivos de privacidad y seguridad, no renderizamos tu información financiera en esta pantalla pública.
                <br /><br />
                Hemos enviado de forma segura el detalle de tus aranceles y saldos a tu correo institucional.
            </p>
            {userData?.correo && (
                <div className="bg-white/10 text-white px-10 py-6 rounded-2xl font-black text-[24px] border-2 border-white/20 shadow-sm animate-pulse">
                    Enviado a: {userData.correo}
                </div>
            )}
        </div>
    );
}

/* ─── 5: Preguntas Frecuentes (FAQ) ─── */
const FAQS = [
    {
        pregunta: '¿Cómo obtengo mi Tarjeta de Identificación Universitaria (TUI)?',
        respuesta: 'Debes subir una foto tamaño carnet al portal de autoatención. Una vez aprobada, recibirás un correo para retirar tu TUI física en el Centro de Servicios al Estudiante.'
    },
    {
        pregunta: '¿Cómo recupero mi clave de Duoc UC?',
        respuesta: 'Ingresa a la página de inicio de sesión de Vivo Duoc, selecciona "Olvidé mi contraseña" y sigue los pasos para recuperar tu acceso mediante tu correo personal alternativo o SMS.'
    },
    {
        pregunta: '¿Qué hago si tengo problemas de bloqueo académico?',
        respuesta: 'El bloqueo académico ocurre por reprobar la misma asignatura tres veces o tener un avance de malla crítico según el reglamento. Debes agendar una cita con tu Director de Carrera para analizar tu caso.'
    },
    {
        pregunta: '¿Dónde veo los beneficios estatales a los que postulé?',
        respuesta: 'Puedes revisar el estado de asignación de CAE, Gratuidad o Becas Ministeriales directamente en el Portal de Beneficios del Mineduc o consultando en Financiamiento en el primer piso.'
    }
];

function FAQCard() {
    return (
        <div className="a11y-inner-card w-full max-w-4xl bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
            <h3 className="text-[42px] font-black text-white mb-10 border-b-2 border-white/20 pb-6 drop-shadow-md">Preguntas Frecuentes</h3>
            <div className="flex flex-col gap-6">
                {FAQS.map((faq, idx) => (
                    <div key={idx} className="bg-white/10 border-2 border-white/20 rounded-[2rem] p-8 hover:bg-white/20 transition-all shadow-sm">
                        <h4 className="text-[28px] font-black text-white mb-4 leading-tight drop-shadow-sm">{faq.pregunta}</h4>
                        <p className="text-[22px] text-white/90 leading-relaxed font-medium">{faq.respuesta}</p>
                    </div>
                ))}
            </div>
            <div className="mt-10 text-center bg-white/10 py-5 rounded-2xl border-2 border-white/20 shadow-inner">
                <p className="text-white/80 font-black uppercase tracking-widest text-[18px]">¿Tu duda no está aquí? Di CERO para hablar con un asesor.</p>
            </div>
        </div>
    );
}

/* ─── Exports ─── */
export default function ResultCard({ tramiteId, userData, resultado }) {
    switch (tramiteId) {
        case 1: return <CertificadoCard userData={userData} />;
        case 2: return <HorarioCard />;
        case 3: return <ProgresoCard />;
        case 4: return <FinancieroCard userData={userData} />;
        case 5: return <FAQCard />;
        default: return null;
    }
}
