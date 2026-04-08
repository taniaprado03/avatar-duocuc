<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>SALA DE ESPERA - DUOC UC</title>
    <link rel="stylesheet" href="styles.css">
</head>

<body>

    <div id="status-voz" onclick="activarVoz()"
        style="position: fixed; bottom: 20px; right: 20px; background: #cc0000; color: white; padding: 15px; border-radius: 50%; cursor: pointer; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; transition: 0.3s;">
        <span id="icono-voz" style="font-size: 30px;">🎤</span>
        <small id="texto-voz"
            style="position: absolute; bottom: -25px; color: white; width: 100px; text-align: center; font-size: 12px;">VOZ
            DESACTIVADA</small>
    </div>

    <header>
        <div class="logo-container">
            <img src="https://image-resizing.p.rapidapi.com/render/image_914eba.png" alt="Duoc UC">
        </div>

        <div class="header-center">
            <h1 style="font-size: 32px; margin: 0; letter-spacing: 1px;">ATENCIÓN DE ALUMNOS</h1>
            <small style="font-size: 16px; opacity: 0.9;">SEDE SAN BERNARDO</small>
        </div>

        <div class="header-right">
            <div id="reloj">00:00:00</div>
            <div id="fecha">Cargando fecha...</div>
        </div>
    </header>

    <div class="container">
        <div class="main-call" id="mainCall">
            <h2>LLAMADO ACTUAL</h2>
            <div class="ticket-number" id="currentTicket">--</div>
            <div class="mesa-number" id="currentMesa">ESPERANDO</div>
        </div>

        <div class="history">
            <h3>Últimos llamados</h3>
            <div id="historyList">
            </div>
        </div>
    </div>

    <audio id="ding" src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"></audio>

    <script src="js/main.js"></script>
</body>

</html>