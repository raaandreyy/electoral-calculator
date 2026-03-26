let barChart = null;

// список партий/кандидатов
let parties = [
    {
        id: 1,
        party: "Социал-демократы",
        candidate: "Анна Мюллер",
        color: "#E63946",
        ideology: "left-center",
        votes: 124000,
    },
    {
        id: 2,
        party: "Либеральный союз",
        candidate: "",
        color: "#457B9D",
        ideology: "center",
        votes: 98000,
    }
];

// считаем сумму всех голосов
function getTotalVotes() {
    let total = 0;
    for (let party of parties) {
        total = total + party.votes;
    }
    return total;
}

function render() {
    const total = getTotalVotes();
    const listEl = document.getElementById("parties-list");

    // очищаем список перед перерисовкой
    listEl.innerHTML = "";

    for (let party of parties) {
        const percent = total > 0 ? ((party.votes / total) * 100).toFixed(1) : 0;

        const name = party.candidate ? `${party.party} - ${party.candidate}` : party.party

        // создаём HTML-строку для партии
        listEl.innerHTML += `
            <div class="party-row" data-id="${party.id}">
                <span class="party-color" style="background: ${party.color}"></span>
                <span class="party-name">${name}</span>
                <input
                    class="party-votes-input"
                    type="number"
                    min="0"
                    value="${party.votes}"
                    data-id="${party.id}"
                    onchange="updateVotes(${party.id}, this.value)"
                >
                <span class="party-percent">${percent}%</span>
                <button class="btn-delete" onclick="deleteParty(${party.id})">X</button>
            </div>
        `;
    }
}

function renderChart() {
    const labels = parties.map(p => p.candidate ? `${p.party} - ${p.candidate}` : p.party);
    const data = parties.map(p => p.votes);
    const colors = parties.map(p => p.color);

    if (barChart !== null) {
        barChart.destroy();
    }

    const canvas = document.getElementById("bar-chart");

    barChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: labels,
            datasets:[{
                data: data,
                backgroundColor: colors,
            }]
        },
        options: {
            indexAxis: "x",
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function addParty() {
    const partyName = document.getElementById("input-party").value.trim();
    const candidate = document.getElementById("input-candidate").value.trim();
    const color = document.getElementById("input-color").value
    const ideology = document.getElementById("input-ideology").value

    if (partyName === "") {
        alert("Введите название партии!");
        return;
    }

    const newParty = {
        id: Date.now(),
        party: partyName,
        candidate: candidate,
        color: color,
        ideology: ideology,
        votes: 0,
    };

    parties.push(newParty)

    // очищаем поля ввода
    document.getElementById("input-party").value = "";
    document.getElementById("input-candidate").value = "";

    render();
    renderChart();
}

function updateVotes(id, value) {
    const party = parties.find(p => p.id === id);
    party.votes = parseInt(value) || 0;
    render();
    renderChart();
}

function deleteParty(id) {
    parties = parties.filter(p => p.id !== id);
    render();
    renderChart();
}

document.getElementById("btn-add-party").addEventListener("click", addParty);

render();
renderChart();