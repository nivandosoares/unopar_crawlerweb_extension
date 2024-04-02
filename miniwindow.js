document.getElementById('startScraping').addEventListener('click', () => {
    const spinner = document.getElementById('spinner');
    spinner.style.display = 'block';
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "startScraping"}, (response) => {
            spinner.style.display = 'none'; // Ocultar o spinner assim que a resposta for recebida
            if (chrome.runtime.lastError) {
                console.error("Erro: ", chrome.runtime.lastError.message);
                return;
            }
            if (response && response.success) {
                if (!Array.isArray(response.dadosInformacoes) || !Array.isArray(response.dadosTotais)) {
                    console.error("Um ou ambos os dados recebidos não são arrays.");
                    // Confirmando se os dados extraídos estão em formato de array
                } else {
                    const tabelaHtml = criarTabela(response.dadosInformacoes, response.dadosTotais);
                    document.getElementById('content').innerHTML = tabelaHtml;
                }
                if (response.agenda && Array.isArray(response.agenda) && response.agenda.length > 0) {
                    const agendaHTML = criarAgenda(response.agenda);
                    document.getElementById('agenda').innerHTML = agendaHTML;
                } else {
                    document.getElementById('agenda').innerHTML = "<p>Não há eventos na agenda.</p>";
                }
            }
           const htmlInformacoes = criarTabela(response.dadosInformacoes, response.dadosTotais);
const htmlAgenda = criarAgenda(response.agenda); 
const semestreAtual = response.semestreAtual;
const htmlCompleto = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Resumo de Atividades ${semestreAtual}</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
    @media print {
        body {
            font-size: 12pt;
            margin: 20mm 10mm; /* Margens maiores para impressão */
        }
        table {
            page-break-inside: auto;
            font-size: 11pt; /* Tamanho de fonte ajustado para tabelas */
        }
        th, td {
            border: 1px solid #ddd; /* Garante que as bordas das tabelas sejam visíveis */
            padding: 5px; /* Ajusta o padding para melhor legibilidade */
        }
        th {
            background-color: #f2f2f2; /* Fundo cinza para cabeçalhos de tabela */
            color: black; /* Cor do texto */
        }
        #print {
            display: none; /* Oculta o botão de impressão */
        }
      #footer{
        display: none;
      }
    }
    
    body, html {
        margin: 0;
        padding: 0;
        font-family: 'Roboto', sans-serif;
        background-color: #f4f4f9;
        color: #333;
    }
    
    header {
        background-color: #6200ea;
        color: #fff;
        padding: 20px 40px;
        text-align: center;
    }
    
    header h1 {
        margin: 0;
        font-weight: 500;
    }
    
    #content {
        display: flex;
        flex-direction: column; 
        gap: 20px;
        padding: 20px;
    }
    
    section {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        padding: 20px;
        margin: 0 20px;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
    }
    
    th, td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #ddd;
    }
    
    th {
        background-color: #6200ee;
        color: #ffffff;
    }
    
    tr:nth-child(even) {
        background-color: #f2f2f2;
    }
    
    footer {
        text-align: center;
        padding: 10px 0;
        background-color: #6200ea;
        color: white;
        position: fixed;
        bottom: 0;
        width: 100%;
    }
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Koulen&family=Lato&family=Nunito&family=Playfair+Display:ital@1&family=Prata&family=Raleway:ital,wght@1,100&family=Roboto&family=Roboto+Condensed&family=Teko&display=swap');

.btn{

font-family: Roboto, sans-serif;
font-weight: 500;
font-size: 14px;
color: #fff;
background: linear-gradient(90deg, #0066CC 0%, #c500cc 100%);
padding: 10px 30px;
border: 2px solid #0066cc;
box-shadow: rgb(0, 0, 0) 0px 0px 0px 0px;
border-radius: 50px;
transition : 1000ms;
transform: translateY(0);
display: flex;
flex-direction: row;
align-items: center;
cursor: pointer;
text-transform: uppercase;
}

.btn:hover{

transition : 1000ms;
padding: 10px 50px;
transform : translateY(-0px);
background: linear-gradient(90deg, #0066CC 0%, #c500cc 100%);
color: #0066cc;
border: solid 2px #0066cc;
}


    
    </style>
</head>
<body>
    <header>
        <h1>${semestreAtual}</h1>


<center>
<button onclick = "window.print();" class="btn" id="print">Imprimir</button>
</center>
    </header>
    <div id="content">
        <section id="informacoes-atividades">
          <center><h1>Boletim parcial</h1></center>
            <!-- Informações das atividades aqui -->
            ${htmlInformacoes}
        </section>
        <section id="agenda-atividades">
          <center><h1>Agenda de atividades</h1></center>
            <!-- Agenda -->
            ${htmlAgenda}
        </section>
    </div>
    <script src="popup.js"></script>
</body>
</html>`;

function abrirNovaAbaComHtmlCompleto(html) {
    const uriHtml = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(html)));
    chrome.tabs.create({ url: uriHtml });
}

// Chamando a função com o HTML completo
abrirNovaAbaComHtmlCompleto(htmlCompleto);


        });

        
    });
});
function criarTabela(dadosInformacoes, dadosTotais) {
    let tabelaHtml = "";
    tabelaHtml += "<table border='1'><tr><th>Disciplina</th><th>Somatório Pontos AVA</th></tr>";

    if (Array.isArray(dadosTotais) && dadosTotais.length) {
        dadosTotais.forEach(item => {
            tabelaHtml += `<tr><td>${item.disciplina}</td><td>${item.somaPontosAVA}</td></tr>`;
        });
    } else {
        tabelaHtml += `<tr><td colspan='2'>Não há somatórios disponíveis.</td></tr>`;
    }

    tabelaHtml += "</table>";

    return tabelaHtml;
}
function criarAgenda(dadosAtividades) {
    const atividadesPorMes = new Map();

    dadosAtividades.forEach(item => {
        const inicioDate = new Date(item.Inicio);
        const vencimentoDate = new Date(item.Vencimento);
        
        const chaveMesAno = inicioDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        if (!atividadesPorMes.has(chaveMesAno)) {
            atividadesPorMes.set(chaveMesAno, []);
        }
        atividadesPorMes.get(chaveMesAno).push({
            ...item,
            Inicio: inicioDate,
            Vencimento: vencimentoDate,
        });
    });

    let tabelaHtml = "";

    atividadesPorMes.forEach((atividades, mesAno) => {
        tabelaHtml += `<center><h3>${mesAno}</h3></center><table border='1'><tr><th>Detalhes</th><th>Início</th><th>Vencimento</th><th>Status</th></tr>`;

        atividades.forEach(({ Detalhes, Inicio, Vencimento, Status }) => {
            // O campo Status agora reflete diretamente o estado da atividade
            tabelaHtml += `<tr><td>${Detalhes}</td><td>${Inicio.toLocaleDateString('pt-BR')}</td><td>${Vencimento.toLocaleDateString('pt-BR')}</td><td>${Status}</td></tr>`;
        });

        tabelaHtml += "</table>";
    });

    return tabelaHtml;
}
