/* ─── ResultCard: per-tramite professional display in Tailwind Vanguard UI ─── */
import { useEffect } from 'react';
import { sendCertificadoEmail } from '../services/emailService';

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
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-duoc-yellow to-duoc-yellow-dark text-black px-6 py-2 rounded-bl-2xl font-black text-sm shadow-lg tracking-wide">
                ✓ GENERADO
            </div>

            <h3 className="text-2xl font-bold text-duoc-blue mb-6 border-b border-gray-200 pb-4">Detalle del Certificado</h3>

            <div className="flex flex-col gap-4">
                {rows.map(({ label, value }) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 last:border-0" key={label}>
                        <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">{label}</span>
                        <span className={`text-lg font-semibold ${label === 'Estado' ? 'text-green-600' : 'text-duoc-blue'}`}>{value}</span>
                    </div>
                ))}
            </div>

            {userData && (
                <div className="mt-6 flex items-center justify-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200 mb-2">
                    <span className="text-sm font-bold animate-pulse">Este documento ha sido enviado exitosamente al correo asociado a tu cuenta: {userData.correo}</span>
                </div>
            )}

            <div className="mt-4 text-center text-xs text-gray-500 uppercase tracking-widest bg-gray-50 py-3 rounded-xl border border-gray-200">
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
        <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-md">
            <div className="bg-gray-50 px-8 py-5 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-duoc-blue">Tu Horario Académico</h3>
                <p className="text-duoc-yellow-dark text-sm font-medium mt-1">Semestre 1 - 2026</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-widest">
                            {['Día', 'Hora', 'Asignatura', 'Sala'].map(h => (
                                <th key={h} className="px-6 py-4 font-bold">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {HORARIO.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-duoc-blue font-bold">{row.dia}</td>
                                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{row.hora}</td>
                                <td className="px-6 py-4 text-gray-800 font-medium">{row.asignatura}</td>
                                <td className="px-6 py-4 text-duoc-blue font-bold bg-gray-50 text-center">{row.sala}</td>
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
        <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-3xl p-8 shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-gray-200 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-duoc-blue">Progreso Académico</h3>
                    <p className="text-gray-500 text-sm mt-1">Rendimiento actual ponderado</p>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-200">
                    <span className="text-gray-500 uppercase tracking-widest text-xs font-bold">Promedio</span>
                    <span className="text-4xl font-black text-duoc-blue">{PROMEDIO}</span>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {ASIGNATURAS.map(({ nombre, nota, creditos }) => {
                    const pct = ((nota / 7) * 100).toFixed(0);
                    const colorClass = nota >= 6.0 ? 'bg-green-500 text-green-600' : nota >= 5.0 ? 'bg-duoc-yellow text-duoc-yellow-dark' : 'bg-red-400 text-red-500';
                    const bgClass = nota >= 6.0 ? 'bg-green-500' : nota >= 5.0 ? 'bg-duoc-yellow' : 'bg-red-400';

                    return (
                        <div className="flex flex-col gap-2" key={nombre}>
                            <div className="flex justify-between items-end">
                                <span className="text-duoc-blue font-medium text-lg leading-tight">{nombre}</span>
                                <div className="flex items-baseline gap-3">
                                    <span className={`text-2xl font-bold ${colorClass.split(' ')[1]}`}>{nota.toFixed(1)}</span>
                                    <span className="text-xs text-gray-400 uppercase font-bold">{creditos} cr.</span>
                                </div>
                            </div>
                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                <div className={`h-full ${bgClass} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── 4: Situación Financiera ─── */
function FinancieroCard() {
    const pagado = 1_250_000;
    const pendiente = 320_000;
    const beca = 430_000;
    const total = pagado + pendiente;
    const fmt = n => '$' + n.toLocaleString('es-CL');
    const pct = ((pagado / total) * 100).toFixed(0);

    return (
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-8 shadow-md">
            <h3 className="text-2xl font-bold text-duoc-blue mb-6">Situación Financiera</h3>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                <span className="text-gray-500 uppercase tracking-widest text-sm font-bold">Arancel Semestral</span>
                <span className="text-3xl font-black text-duoc-blue mt-2 sm:mt-0">{fmt(total)}</span>
            </div>

            <div className="flex flex-col gap-4 mb-8">
                <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium text-lg">Pagado</span>
                    <span className="text-green-600 font-bold text-xl">{fmt(pagado)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium text-lg">Beca / Beneficio</span>
                    <span className="text-duoc-yellow-dark font-bold text-xl">{fmt(beca)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-t border-gray-200 mt-2">
                    <span className="text-duoc-blue font-bold text-xl">Saldo pendiente</span>
                    <span className="text-duoc-yellow-dark font-black text-2xl">{fmt(pendiente)}</span>
                </div>
            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4 border border-gray-200">
                <div className="h-full bg-gradient-to-r from-duoc-yellow to-green-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>

            <p className="text-center text-gray-500 text-sm font-medium">Próximo vencimiento: <span className="text-gray-900">15 de Marzo 2026</span></p>
        </div>
    );
}

/* ─── Exports ─── */
export default function ResultCard({ tramiteId, userData, resultado }) {
    switch (tramiteId) {
        case 1: return <CertificadoCard userData={userData} />;
        case 2: return <HorarioCard />;
        case 3: return <ProgresoCard />;
        case 4: return <FinancieroCard />;
        default: return null;
    }
}
