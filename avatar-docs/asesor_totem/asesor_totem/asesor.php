<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Asesor - Duoc UC San bernardo</title>
    <style>
        /* ESTILOS (pa poner hermosa esta cuestion ) */
        body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #f0f2f5;
            margin: 0;
            padding: 20px;
        }

        .setup-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #002d55;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .setup-screen select {
            padding: 15px;
            font-size: 1.2rem;
            margin: 20px;
            border-radius: 5px;
            min-width: 200px;
        }

        .btn-start {
            padding: 15px 30px;
            font-size: 1.2rem;
            background: #ffb800;
            border: none;
            cursor: pointer;
            font-weight: bold;
            border-radius: 5px;
            color: #000;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            background: white;
            padding: 15px;
            border-radius: 10px;
        }

        .container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .serving-area {
            background: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .big-ticket {
            font-size: 5rem;
            font-weight: bold;
            color: #002d55;
            margin: 10px 0;
        }

        .btn-finish {
            background: #dc3545;
            color: white;
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 5px;
            font-size: 1.2rem;
            cursor: pointer;
            font-weight: bold;
            margin-top: 20px;
        }

        .queue-list {
            background: white;
            padding: 20px;
            border-radius: 10px;
            height: 500px;
            overflow-y: auto;
        }

        .ticket-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #eee;
        }

        .btn-call {
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        }

        .btn-call:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        /* ESTILOS DEL NUEVO RECUADRO (Esto faltaba) 👇 */
        .other-advisors {
            margin-top: 20px;
            background: white;
            padding: 20px;
            border-radius: 10px;
        }

        .advisor-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }

        .advisor-badge {
            background: #002d55;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 0.9rem;
        }
    </style>
</head>

<body>

    <div id="setup" class="setup-screen">
        <img src="https://www.duoc.cl/wp-content/uploads/2020/03/logo-duoc.png" width="200"
            style="margin-bottom: 30px;">
        <h2>Selecciona tu puesto</h2>
        <select id="mesaSelector">
            <option value="1">Mesa 1</option>
            <option value="2">Mesa 2</option>
            <option value="3">Mesa 3</option>
            <option value="4">Mesa 4</option>
        </select>
        <button class="btn-start" onclick="iniciarSesion()">Comenzar Jornada</button>
    </div>

    <div id="mainPanel" style="display:none;">
        <header>
            <h2 id="labelMesa">Mesa --</h2>
            <button onclick="location.reload()" style="padding: 10px;">Cambiar Mesa</button>
        </header>

        <div class="container">
            <div style="display:flex; flex-direction:column; gap:20px;">

                <div class="serving-area" id="areaAtencion">
                    <p style="color:#999; font-size: 1.2rem;">Mesa Disponible</p>
                </div>

                <div class="other-advisors">
                    <h3>Otros Asesores</h3>
                    <div id="otrosAsesoresList">Cargando...</div>
                </div>

            </div>

            <div class="queue-list">
                <h3>En Espera</h3>
                <div id="listaEspera">Cargando...</div>
            </div>
        </div>
    </div>

    <script src="js/script.js"></script>
</body>



</html>