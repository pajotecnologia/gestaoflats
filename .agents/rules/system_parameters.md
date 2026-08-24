# System Parameters Rule - Evolution API & SMTP Gmail

Sempre que a página de Parâmetros (`/parametros`) for editada ou mantida, os seguintes blocos DEVEM estar presentes e funcionais sem omissões:

1. **Evolution API (WhatsApp)**:
   - `evolutionApiUrl`: URL da Evolution API (ex: `https://api.evolution.suaempresa.com`)
   - `evolutionApiKey`: API Key Global
   - `evolutionInstance`: Nome da Instância do WhatsApp
   - Status da Conexão com indicador visual (*CONECTADO / DESCONECTADO*)
   - Botão de Testar Conexão com Evolution API.

2. **Servidor SMTP (Gmail / E-mail Server)**:
   - `smtpHost`: Servidor SMTP (`smtp.gmail.com`)
   - `smtpPort`: Porta SMTP (`465` SSL ou `587` TLS)
   - `smtpUser`: E-mail de autenticação
   - `smtpPass`: Senha de Aplicativo (App Password)
   - `smtpSecure`: Usar SSL/TLS (true/false)
   - `smtpFromEmail`: E-mail Remetente oficial
   - Botão de Testar Envio de E-mail de Teste SMTP.

3. **Assinatura Digital da Empresa**:
   - Painel Canvas SignaturePad para desenhar com o mouse ou toque do celular.
