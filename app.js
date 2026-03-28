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

function distributeDhondt(eligible, totalSeats) {
    // создаём массив с делителями
    const result = eligible.map(p => ({ ...p, seats: 0, divisor: 1, }));

    for (let i = 0; i < totalSeats; i++) {
        // считаем частное для каждой партии
        const quotients = result.map(p => p.votes / p.divisor);

        //находим индекс партии с макс. частным
        const maxIndex = quotients.indexOf(Math.max(...quotients));
        result[maxIndex].seats += 1;

        //увеличиваем делитель для следующего раунда
        result[maxIndex].divisor += 1;
    }

    return result;
}

function distributeHare(eligible, totalSeats) {
    const totalVotes = eligible.reduce((sum, p) => sum + p.votes, 0);

    const result = eligible.map(p => {
        const exact = (p.votes / totalVotes) * totalSeats;
        return {...p, seats: Math.floor(exact), remainder: exact - Math.floor(exact),};
    });

    let remaining = totalSeats - result.reduce((sum, p) => sum + p.seats, 0);

    result
        .sort((a, b) => b.remainder - a.remainder)
        .slice(0, remaining)
        .forEach(p => p.seats += 1);

    return result;
}

function calculateSeats() {
    const totalSeats = parseInt(document.getElementById("input-seats").value);
    const threshold = parseFloat(document.getElementById("input-threshold").value) || 0;
    const method = document.getElementById("input-method").value;

    if (!totalSeats || totalSeats < 1) {
        alert("Введите число мест в парламенте");
        return;
    }

    const totalVotes = getTotalVotes();

    // фильтр партий
    const eligible = parties.filter(p => {
        const percent = (p.votes / totalVotes) * 100;
        return percent >= threshold;
    });

    if (eligible.length === 0) {
        alert("Ни одна партия не преодолела порог");
        return;
    }

    const result = method === "dhondt" 
    ? distributeDhondt(eligible, totalSeats)
    : distributeHare(eligible, totalSeats);

    const resultEl = document.getElementById("seats-result");
    resultEl.innerHTML = "";

    result.sort((a,b) => b.seats - a.seats);

    for (let party of result) {
        resultEl.innerHTML += `
            <div class="party-row">
                <span class="party-color" style="background: ${party.color}"></span>
                <span class="party-name">${party.party}</span>
                <span class="party-seats">${party.seats} мест</span>
            </div>
        `;
    }

    renderParliament(result);
}

document.getElementById("btn-add-party").addEventListener("click", addParty);
document.getElementById("btn-calculate").addEventListener("click", calculateSeats);

function buildRows(totalSeats, dotRadius) {
    const minRadius = 80;
    const maxRadius = 260;
    const gap = dotRadius * 2.5; // расстояние между рядами

    const rows = [];
    let remaining = totalSeats;
    let r = minRadius;

    while (remaining > 0 && r <= maxRadius) {
        // сколько мест влезает в дугу такого радиуса
        const capacity = Math.floor(Math.PI * r / gap);
        const count = Math.min(capacity, remaining);
        rows.push({ radius: r, count: count });
        remaining -= count;
        r += gap;
    }
    
    return rows;
}

function assignDots(result, rows) {
    const dots = [];
    const totalSeats = result.reduce((sum, p) => sum + p.seats, 0);

    // считаем общее число позиций во всех рядах
    const totalPositions = rows.reduce((sum, row) => sum + row.count, 0);

    // считаем угловые диапазоны для каждой партии
    let angleOffset = 0;
    const partyRanges = result.map(party => {
        const fraction = party.seats / totalSeats;
        const range = {
            party: party.party,
            color: party.color,
            seats: party.seats,
            start: angleOffset,
            end: angleOffset + fraction,
        };
        angleOffset += fraction;
        return range;
    });

    // раскладываем по рядам и позициям
    let globalIndex = 0;
    for (let row of rows) {
        for (let pos = 0; pos < row.count; pos++) {
            // нормализованная позиция от 0 до 1
            const fraction = globalIndex / (totalPositions - 1);
            const angle = Math.PI - fraction * Math.PI;

            // находим партию, диапазону которой принадлежит место
            const party = partyRanges.find(r => fraction >= r.start && fraction < r.end)
                || partyRanges[partyRanges.length - 1];
            
            dots.push({
                color: party.color,
                party: party.party,
                seats: party.seats,
                radius: row.radius,
                angle: angle,
            });
            globalIndex++;
        }
    }

    return dots;
}

function renderParliament(result) {
    const container = document.getElementById("parliament-chart");
    container.innerHTML = "";

    const totalSeats = result.reduce((sum,p) => sum + p.seats, 0);
    if (totalSeats === 0) return;

    // параметры SVG
    const width = 600;
    const height = 320;
    const centerX = width / 2;
    const centerY = height - 20;
    const dotRadius = 6;

    const rows = buildRows(totalSeats, dotRadius);
    const totalPositions = rows.reduce((sum, row) => sum + row.count, 0);
    const dots = assignDots(result, rows);

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

    for (let dot of dots) {
        const x = centerX + dot.radius * Math.cos(dot.angle);
        const y = centerY - dot.radius * Math.sin(dot.angle);

        svg += `<circle
            cx="${x.toFixed(1)}"
            cy="${y.toFixed(1)}"
            r="${dotRadius}"
            fill="${dot.color}"
            title="${dot.party}: ${dot.seats} мест"
        />`;
    }

    svg += `</svg>`;
    container.innerHTML = svg;
}

render();
renderChart();