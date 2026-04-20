# ══════════════════════════════════════════════════════════════
# TanIA Backend — PHP + Apache + SQLite
# Sistema de tickets, emails y gestión de turnos
# ══════════════════════════════════════════════════════════════

FROM php:8.3-apache

# Instalar extensiones necesarias + sqlite3 CLI para inspección
RUN apt-get update && apt-get install -y \
    libsqlite3-dev \
    sqlite3 \
    && docker-php-ext-install pdo pdo_sqlite \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Habilitar mod_rewrite y headers para CORS
RUN a2enmod rewrite headers

# Configurar Apache para permitir .htaccess
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Copiar código del backend
COPY avatar-docs/asesor_totem/asesor_totem/ /var/www/html/

# Crear directorio para la base de datos SQLite con permisos
# ⚠️ CRÍTICO: El archivo .sqlite debe ser www-data para que PHP pueda escribir
RUN mkdir -p /var/www/html/data \
    && touch /var/www/html/data/database.sqlite \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod 777 /var/www/html/data \
    && chmod 664 /var/www/html/data/database.sqlite

# Puerto
EXPOSE 80

CMD ["apache2-foreground"]
