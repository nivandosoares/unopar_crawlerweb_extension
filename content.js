chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "startScraping") {
        Promise.all([extrairInformacoes(), extrairTotais(), extrairSemestre()]).then(([dadosInformacoes, dadosTotais, semestreAtual]) => {
            const agenda = extrairDatasEAtividades(dadosInformacoes);
            
            sendResponse({success: true, dadosInformacoes, dadosTotais, agenda, semestreAtual});
        }).catch(error => {
            sendResponse({success: false, error: error.message});
        });
        

        return true; // Indica que a resposta será enviada de forma assíncrona
    }
});
    

function extrairSemestre(){
    const selector = document.querySelector("#matriculaId");
    const semestreAtual = selector.options[selector.selectedIndex].text;
    return semestreAtual; 
}

async function aguardarElemento(seletor, tempoDeEsperaMax = 30000) {
    let tempoTotalEsperado = 0;
    const intervaloDeVerificacao = 100; // Tempo em milissegundos para verificar a presença do elemento

    return new Promise((resolve, reject) => {
        const intervalo = setInterval(() => {
            const elemento = document.querySelector(seletor);
            if (elemento) {
                clearInterval(intervalo);
                resolve(elemento);
            } else if (tempoTotalEsperado >= tempoDeEsperaMax) {
                clearInterval(intervalo);
                reject(new Error(`Elemento não encontrado: ${seletor}`));
            } else {
                tempoTotalEsperado += intervaloDeVerificacao;
            }
        }, intervaloDeVerificacao);
    });
}

function extrairDatasEAtividades(atividades) {
    const regex = /(\d{2})\/(\d{2})\/(\d{2})\s+00:00\s+à\s+(\d{2})\/(\d{2})\/(\d{2})\s+23:59/;
    const agenda = atividades.map(atividade => {
        const match = atividade.Detalhes.match(regex);
        if (match) {
            const detalhesSemData = atividade.Detalhes.substring(0, atividade.Detalhes.indexOf(match[0])).trim();

            // Ajuste na conversão das datas para objetos Date
            const dataInicio = new Date(`20${match[3]}`, `${parseInt(match[2], 10) - 1}`, match[1]);
            const dataVencimento = new Date(`20${match[6]}`, `${parseInt(match[5], 10) - 1}`, match[4]);

            // Determina o status da atividade com base no campo "Pontos"
            let status = atividade.Pontos;
            if (atividade.Pontos === 'Realizada') {
                status = '<i title="Atividade realizada" class="fa fa-check" style="color:#0984e3;"></i><span>&#10003;</span> Realizada - Aguardando Lançamento';
            } else if (atividade.Pontos === 'Não realizada') {
                status = '<i title="Atividade não realizada" class="fa fa-times" style="color:gray;"></i><span>&#10005;</span> Não realizada';
            } // Se "Pontos" for um número, ele simplesmente passa como está.

            return {
                Detalhes: detalhesSemData,
                Inicio: dataInicio,
                Vencimento: dataVencimento,
                Status: status // Usamos "Status" ao invés de "Pontos" para clareza
            };
        }
        return null;
    }).filter(item => item !== null);

    // Ordenando as atividades pela data de início
    agenda.sort((a, b) => a.Inicio.getTime() - b.Inicio.getTime());

    return agenda;
}
  
  




async function cliqueEspera(elemento, tempoDeEspera) {
    return new Promise(resolve => {
        elemento.click();
        setTimeout(resolve, tempoDeEspera);
    });
}

function limparTexto(texto) {
    return texto.replace(/\s+/g, ' ').trim();
}

function extrairPontos(detalhe) {
    const regexPontos = /(\d+)\s*pontos$/; // Expressão regular para encontrar "1200 pontos" no final da string
    const match = detalhe.match(regexPontos);
    return match ? parseInt(match[1], 10) : 0; // Converte o número encontrado para inteiro ou retorna 0 se não encontrar
}

async function extrairInformacoes() {
    const linhasDisciplinas = document.querySelectorAll("tr");
    const dadosAtividades = [];

    for (let linha of linhasDisciplinas) {
        const botaoDetalhes = linha.querySelector(".btnMaisDetalhes");

        if (!botaoDetalhes) continue;

        const idBoletim = botaoDetalhes.getAttribute("data-boletim-id");
        if (!idBoletim) continue;

        await cliqueEspera(botaoDetalhes, 500);

        const seletorAtividades = `#atividades-${idBoletim}`;
        const containerAtividades = document.querySelector(seletorAtividades);

        if (containerAtividades) {
            const itensAtividades = containerAtividades.querySelectorAll("li");

            Array.from(itensAtividades).forEach((itemAtividade) => {
                const tabelas = itemAtividade.querySelectorAll("table");
                tabelas.forEach((tabela) => {
                    const celulas = tabela.querySelectorAll("td");
                    const dados = Array.from(celulas).map(celula => limparTexto(celula.textContent));

                    const iconeRealizada = tabela.querySelector(".fa-check") !== null;
                    const iconeNaoRealizada = tabela.querySelector(".fa-times") !== null;
                    const pontosElemento = tabela.querySelector(".label-info");
                    const pontosTexto = pontosElemento ? pontosElemento.textContent.trim() : "0";
                    const pontos = parseInt(pontosTexto, 10);

                    let status;
                     if (iconeRealizada && pontos === 0) {
                        status = "Realizada"; // Considera realizada para ícone check com 0 pontos, sem ícone de briefcase
                    }
                    else if(iconeNaoRealizada && pontos !== 0){
                        status = pontosTexto ; // para atividades não realizadas com pontos, considera os pontos
                    } else if (iconeNaoRealizada) {
                        status = "Não realizada"; // Considera não realizada para ícone times
                    } else if (pontos > 0) {
                        status = pontosTexto; // Mostra pontos se maior que zero
                    } else {
                        status = "Estado desconhecido"; // Captura outros casos, se existirem
                    }

                    if (dados.length > 0) {
                        dadosAtividades.push({
                            Detalhes: dados.join(' - '),
                            Pontos: status, // Usa o status calculado
                            Realizada: iconeRealizada || iconeNaoRealizada
                        });
                    }
                });
            });
        }

        await cliqueEspera(botaoDetalhes, 500);
    }

    return dadosAtividades;
}




async function extrairPontosAVA() {
    const selector = `div[id^="colMd0"] p`; // Seleciona todos os elementos <p> dentro de um <div> com ID começando com "colMd0"
    await aguardarElemento(selector); // Aguarda o elemento com os pontos do AVA estar visível
    const elementosPontos = document.querySelectorAll(selector);
    return Array.from(elementosPontos).map(el => parseInt(el.textContent.trim(), 10) || 0);
}

async function fecharModalAVA() {
    // Fecha o modal 
        const botaoFechar = document.querySelector(`button[id="tour-step-3-close"]`);
    if (botaoFechar) {
        botaoFechar.click();
        await new Promise(resolve => setTimeout(resolve, 500)); // Espera um pouco para garantir que o modal/aba foi fechado
    }
}

async function extrairTotais() {
    const resultados = [];

    const botaoDetalhes = document.querySelectorAll(`button[id^="tour-btn-step-3-"]`);
    for (let botao of botaoDetalhes) {
        await cliqueEspera(botao);

        const pontosAVA = await extrairPontosAVA();
        const somaPontosAVA = pontosAVA.reduce((acc, curr) => acc + curr, 0); // Soma todos os pontos encontrados
        const disciplina = botao.closest('li').querySelector('.atividadesCronogramaTableNome a').textContent.trim();

        resultados.push({ disciplina, somaPontosAVA });

        await fecharModalAVA(); // Fechar o modal ou seção do AVA após extrair os pontos
    }
    return resultados;


}



