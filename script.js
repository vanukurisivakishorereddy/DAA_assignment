// ==============================
// SHARED STATE
// ==============================

let inputSizes = [100, 200, 400, 600, 800, 1000, 1500, 2000];

let visualizerArray = [];
let visualizerIndex = 0;
let visualizerLow = 0;
let visualizerHigh = 0;
let visualizerFinished = false;
let visualizerComparisons = 0;
let visualizerSteps = 0;
let visualizerPlayHandle = null;

let complexityChart = null;
let benchmarkChart = null;


// ==============================
// PAGE NAVIGATION
// ==============================

function switchPage(pageName) {

    let pages = document.querySelectorAll(".page");

    for (let i = 0; i < pages.length; i++) {
        pages[i].classList.remove("active");
    }

    let links = document.querySelectorAll(".nav-link");

    for (let i = 0; i < links.length; i++) {
        links[i].classList.remove("active");
    }

    let targetPage = document.getElementById("page-" + pageName);

    let targetLink =
        document.querySelector('.nav-link[data-page="' + pageName + '"]');

    if (targetPage) {
        targetPage.classList.add("active");
    }

    if (targetLink) {
        targetLink.classList.add("active");
    }

    document.getElementById("navLinks").classList.remove("open");

    if (pageName === "graph") {
        setTimeout(function () {
            if (complexityChart !== null) complexityChart.resize();
            if (benchmarkChart !== null) benchmarkChart.resize();
        }, 0);
    }

    window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
        switchPage(this.getAttribute("data-page"));
    });
});

document.querySelectorAll("[data-goto]").forEach(function (button) {
    button.addEventListener("click", function () {
        switchPage(this.getAttribute("data-goto"));
    });
});

document.getElementById("navToggle").addEventListener("click", function () {
    document.getElementById("navLinks").classList.toggle("open");
});


// ==============================
// THEORETICAL COMPLEXITY MATH
// ==============================

function theoreticalOps(algorithm, testCase, n) {

    if (n <= 0) {
        return 0;
    }

    if (algorithm === "linear") {

        if (testCase === "best") {
            return 1;
        }

        if (testCase === "average") {
            return Math.max(1, Math.round(n / 2));
        }

        return n;
    }

    let maxSteps = Math.floor(Math.log2(n)) + 1;

    if (testCase === "best") {
        return 1;
    }

    if (testCase === "average") {
        return Math.max(1, maxSteps - 1);
    }

    return maxSteps;
}


function advantageLabel(linearValue, binaryValue, unitSuffix) {

    if (binaryValue <= 0 || linearValue <= binaryValue) {
        return "No difference";
    }

    let ratio = linearValue / binaryValue;

    let roundedRatio =
        ratio >= 10 ? Math.round(ratio) : Math.round(ratio * 10) / 10;

    if (roundedRatio <= 1) {
        return "Slightly fewer";
    }

    return roundedRatio + "× fewer" +
        (unitSuffix ? " " + unitSuffix : "");
}


// ==============================
// REAL SEARCH IMPLEMENTATIONS
// ==============================

function realLinearSearch(arr, target) {

    for (let i = 0; i < arr.length; i++) {

        if (arr[i] === target) {
            return i;
        }
    }

    return -1;
}


function realBinarySearch(arr, target) {

    let low = 0;
    let high = arr.length - 1;

    while (low <= high) {

        let mid = Math.floor((low + high) / 2);

        if (arr[mid] === target) {
            return mid;
        }

        if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return -1;
}


function measureAlgorithm(searchFn, size, trials) {

    let arr = new Array(size);

    for (let i = 0; i < size; i++) {
        arr[i] = i * 2;
    }

    let missingTarget = -1;

    let start = performance.now();

    for (let t = 0; t < trials; t++) {
        searchFn(arr, missingTarget);
    }

    let end = performance.now();

    return (end - start) / trials;
}


// ==============================
// REFERENCE SIZES
// ==============================

function updateReferenceSizes() {

    let raw = document.getElementById("referenceSizes").value;

    let parsed = raw
        .split(",")
        .map(function (piece) {
            return parseInt(piece.trim());
        })
        .filter(function (n) {
            return Number.isInteger(n) && n > 0;
        });

    parsed = Array.from(new Set(parsed)).sort(function (a, b) {
        return a - b;
    });

    if (parsed.length === 0) {

        document.getElementById("complexityTable").innerHTML =
            '<tr><td colspan="4" class="empty-row">Enter at least one valid positive whole number.</td></tr>';

        return;
    }

    inputSizes = parsed;

    document.getElementById("referenceSizes").value =
        parsed.join(", ");

    computeComplexityTable();
}


// ==============================
// THEORETICAL TABLE + CHART
// ==============================

function computeComplexityTable() {

    let testCase =
        document.getElementById("testCase").value;

    let table =
        document.getElementById("complexityTable");

    table.innerHTML = "";

    let linearOpsData = [];
    let binaryOpsData = [];

    for (let i = 0; i < inputSizes.length; i++) {

        let size = inputSizes[i];

        let linearOps =
            theoreticalOps("linear", testCase, size);

        let binaryOps =
            theoreticalOps("binary", testCase, size);

        linearOpsData.push(linearOps);
        binaryOpsData.push(binaryOps);

        let row = document.createElement("tr");

        row.innerHTML =
            "<td>" + size + "</td>" +
            "<td>" + linearOps + "</td>" +
            "<td>" + binaryOps + "</td>" +
            "<td>" +
            advantageLabel(
                linearOps,
                binaryOps,
                "comparisons"
            ) +
            "</td>";

        table.appendChild(row);
    }

    updateComplexityChart(
        inputSizes,
        linearOpsData,
        binaryOpsData
    );
}


function updateComplexityChart(labels, linearData, binaryData) {

    const canvas =
        document.getElementById("complexityChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    if (complexityChart !== null) {
        complexityChart.destroy();
    }

    complexityChart = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "Linear Search — O(n)",
                    data: linearData,
                    borderColor: "#fb923c",
                    backgroundColor: "rgba(251, 146, 60, 0.12)",
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                },

                {
                    label: "Binary Search — O(log n)",
                    data: binaryData,
                    borderColor: "#22d3ee",
                    backgroundColor: "rgba(34, 211, 238, 0.12)",
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                }

            ]
        },

        options: chartOptions(
            "Array Size (N)",
            "Calculated Operations",
            " operations"
        )
    });
}


function chartOptions(xTitle, yTitle, unitSuffix) {

    return {

        responsive: true,

        maintainAspectRatio: false,

        color: "#9aa5c0",

        plugins: {

            legend: {

                display: true,

                position: "top",

                labels: {
                    color: "#d3d9ea",
                    font: {
                        family: "Inter, sans-serif"
                    }
                }
            },

            tooltip: {

                callbacks: {

                    label: function (context) {

                        return context.dataset.label +
                            ": " +
                            context.raw +
                            unitSuffix;
                    }
                }
            }
        },

        scales: {

            x: {

                title: {
                    display: true,
                    text: xTitle,
                    color: "#9aa5c0"
                },

                ticks: {
                    autoSkip: false,
                    color: "#7c88a6"
                },

                grid: {
                    color: "rgba(255,255,255,0.06)"
                }
            },

            y: {

                beginAtZero: true,

                title: {
                    display: true,
                    text: yTitle,
                    color: "#9aa5c0"
                },

                ticks: {
                    color: "#7c88a6"
                },

                grid: {
                    color: "rgba(255,255,255,0.06)"
                }
            }
        }
    };
}


// ==============================
// CUSTOM INPUT SIZE CALCULATOR
// ==============================

function calculateCustomSize() {

    let sizeInput =
        document.getElementById("customSize");

    let size =
        parseInt(sizeInput.value);

    let resultBox =
        document.getElementById("customComparisonResult");

    if (Number.isNaN(size) || size <= 0) {

        document.getElementById("customLinearOps")
            .textContent = "—";

        document.getElementById("customBinaryOps")
            .textContent = "—";

        resultBox.textContent =
            "Enter a whole number greater than 0.";

        return;
    }

    let testCase =
        document.getElementById("testCase").value;

    let linearOps =
        theoreticalOps("linear", testCase, size);

    let binaryOps =
        theoreticalOps("binary", testCase, size);

    document.getElementById("customLinearOps")
        .textContent =
        linearOps + " op" +
        (linearOps === 1 ? "" : "s");

    document.getElementById("customBinaryOps")
        .textContent =
        binaryOps + " op" +
        (binaryOps === 1 ? "" : "s");

    let label =
        advantageLabel(
            linearOps,
            binaryOps,
            "comparisons"
        );

    resultBox.innerHTML =
        "For N = " +
        size +
        ", Binary Search needs <strong>" +
        label +
        "</strong> than Linear Search.";

    document.getElementById("statInputSize")
        .textContent = size;
}


// ==============================
// MEASURED BENCHMARK
// ==============================

function runMeasuredBenchmark() {

    let statusBox =
        document.getElementById("benchmarkStatus");

    let trials =
        parseInt(
            document.getElementById("trialsCount").value
        );

    if (Number.isNaN(trials) || trials <= 0) {

        statusBox.textContent =
            "Enter a valid number of trials greater than 0.";

        return;
    }

    statusBox.textContent =
        "Running benchmark…";

    setTimeout(function () {

        let table =
            document.getElementById("benchmarkTable");

        table.innerHTML = "";

        let linearTimes = [];
        let binaryTimes = [];

        for (let i = 0; i < inputSizes.length; i++) {

            let size = inputSizes[i];

            let linearMs =
                measureAlgorithm(
                    realLinearSearch,
                    size,
                    trials
                );

            let binaryMs =
                measureAlgorithm(
                    realBinarySearch,
                    size,
                    trials
                );

            linearTimes.push(linearMs);
            binaryTimes.push(binaryMs);

            let faster =
                linearMs <= binaryMs
                    ? "Linear Search"
                    : "Binary Search";

            if (Math.abs(linearMs - binaryMs) < 0.0005) {
                faster = "No difference";
            }

            let row =
                document.createElement("tr");

            row.innerHTML =
                "<td>" + size + "</td>" +
                "<td>" + linearMs.toFixed(4) + "</td>" +
                "<td>" + binaryMs.toFixed(4) + "</td>" +
                "<td>" + faster + "</td>";

            table.appendChild(row);
        }

        updateBenchmarkChart(
            inputSizes,
            linearTimes,
            binaryTimes
        );

        let customSize =
            parseInt(
                document.getElementById("customSize").value
            );

        if (!Number.isNaN(customSize) && customSize > 0) {

            let customLinearMs =
                measureAlgorithm(
                    realLinearSearch,
                    customSize,
                    trials
                );

            let customBinaryMs =
                measureAlgorithm(
                    realBinarySearch,
                    customSize,
                    trials
                );

            document.getElementById("statInputSize")
                .textContent = customSize;

            document.getElementById("statLinearTime")
                .textContent =
                customLinearMs.toFixed(4) + " ms";

            document.getElementById("statBinaryTime")
                .textContent =
                customBinaryMs.toFixed(4) + " ms";

            let fasterLabel;

            if (
                Math.abs(
                    customLinearMs - customBinaryMs
                ) < 0.0005
            ) {

                fasterLabel = "No difference";

            } else if (customLinearMs < customBinaryMs) {

                fasterLabel = "Linear Search";

            } else {

                fasterLabel = "Binary Search";
            }

            document.getElementById("statFaster")
                .textContent = fasterLabel;
        }

        statusBox.textContent =
            "Benchmark complete — " +
            trials +
            " trials per size, measured with performance.now() on arrays built in this browser.";

    }, 20);
}


function updateBenchmarkChart(
    labels,
    linearData,
    binaryData
) {

    const canvas =
        document.getElementById("benchmarkChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    if (benchmarkChart !== null) {
        benchmarkChart.destroy();
    }

    benchmarkChart = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "Linear Search — measured (ms)",
                    data: linearData,
                    borderColor: "#fb923c",
                    backgroundColor: "rgba(251, 146, 60, 0.12)",
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                },

                {
                    label: "Binary Search — measured (ms)",
                    data: binaryData,
                    borderColor: "#22d3ee",
                    backgroundColor: "rgba(34, 211, 238, 0.12)",
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                }

            ]
        },

        options: chartOptions(
            "Array Size (N)",
            "Average Time per Run (ms)",
            " ms"
        )
    });
}


// ==============================
// RESET
// ==============================

function resetPage() {

    document.getElementById("testCase").value =
        "worst";

    document.getElementById("customSize").value =
        "500";

    document.getElementById("trialsCount").value =
        "200";

    document.getElementById("customLinearOps")
        .textContent = "—";

    document.getElementById("customBinaryOps")
        .textContent = "—";

    document.getElementById("customComparisonResult")
        .textContent =
        "Enter a size above and click Calculate.";

    document.getElementById("statInputSize")
        .textContent = "500";

    document.getElementById("statLinearTime")
        .textContent = "—";

    document.getElementById("statBinaryTime")
        .textContent = "—";

    document.getElementById("statFaster")
        .textContent = "—";

    document.getElementById("benchmarkStatus")
        .textContent =
        "No benchmark run yet.";

    document.getElementById("benchmarkTable")
        .innerHTML =
        '<tr><td colspan="4" class="empty-row">Run the benchmark to see measured results.</td></tr>';

    inputSizes = [
        100,
        200,
        400,
        600,
        800,
        1000,
        1500,
        2000
    ];

    document.getElementById("referenceSizes")
        .value =
        "100, 200, 400, 600, 800, 1000, 1500, 2000";

    if (complexityChart !== null) {

        complexityChart.destroy();
        complexityChart = null;
    }

    if (benchmarkChart !== null) {

        benchmarkChart.destroy();
        benchmarkChart = null;
    }

    computeComplexityTable();
    calculateCustomSize();
}


// ==============================
// VISUALIZER ARRAY
// ==============================

function parseVisualizerArray() {

    let raw =
        document.getElementById("arrayInput").value;

    let parsed =
        raw
            .split(",")
            .map(function (piece) {
                return parseInt(piece.trim());
            })
            .filter(function (n) {
                return Number.isInteger(n);
            });

    parsed =
        Array.from(new Set(parsed))
            .sort(function (a, b) {
                return a - b;
            });

    if (parsed.length === 0) {

        parsed = [
            10, 20, 30, 40, 50,
            60, 70, 80, 90, 100, 110
        ];
    }

    return parsed;
}


function randomizeVisualizerArray() {

    let length =
        10 + Math.floor(Math.random() * 4);

    let value =
        Math.floor(Math.random() * 6) + 1;

    let values = [];

    for (let i = 0; i < length; i++) {

        value +=
            Math.floor(Math.random() * 8) + 2;

        values.push(value);
    }

    document.getElementById("arrayInput")
        .value =
        values.join(", ");

    resetVisualizer();
}


// ==============================
// DISPLAY VISUALIZER
// ==============================

function displayVisualizerArray(
    currentIndex = -1,
    middleIndex = -1,
    foundIndex = -1,
    eliminatedRange = null
) {

    let container =
        document.getElementById("arrayContainer");

    container.innerHTML = "";

    for (
        let i = 0;
        i < visualizerArray.length;
        i++
    ) {

        let item =
            document.createElement("div");

        item.className = "array-item";

        let indexLabel =
            document.createElement("span");

        indexLabel.className =
            "array-index";

        indexLabel.textContent =
            "#" + i;

        let box =
            document.createElement("div");

        box.className =
            "array-box";

        let statusText = "";

        if (
            eliminatedRange &&
            i >= eliminatedRange[0] &&
            i <= eliminatedRange[1]
        ) {

            box.classList.add("checked");
        }

        if (i === currentIndex) {

            box.classList.add("current");
            statusText = "CURR";
        }

        if (i === middleIndex) {

            box.classList.add("middle");
            statusText = "MID";
        }

        if (i === foundIndex) {

            box.classList.add("found");
            statusText = "FOUND";
        }

        box.textContent =
            visualizerArray[i];

        let statusLabel =
            document.createElement("span");

        statusLabel.className =
            "array-status" +
            (statusText ? " visible" : "");

        statusLabel.textContent =
            statusText;

        item.appendChild(indexLabel);
        item.appendChild(box);
        item.appendChild(statusLabel);

        container.appendChild(item);
    }
}


// ==============================
// EXECUTION STATE PANEL
// ==============================

function updateExecState(
    currentIndex,
    currentElement,
    status
) {

    document.getElementById("stateCurrentIndex")
        .textContent =
        currentIndex === null
            ? "—"
            : currentIndex;

    document.getElementById("stateCurrentElement")
        .textContent =
        currentElement === null
            ? "—"
            : currentElement;

    document.getElementById("comparisonsCount")
        .textContent =
        visualizerComparisons;

    document.getElementById("stateSteps")
        .textContent =
        visualizerSteps;

    document.getElementById("stateStatus")
        .textContent =
        status;
}


// ==============================
// RESET VISUALIZER
// ==============================

function stopPlaying() {

    if (visualizerPlayHandle !== null) {

        clearInterval(visualizerPlayHandle);

        visualizerPlayHandle = null;
    }

    document.getElementById("playButton")
        .disabled = false;

    document.getElementById("pauseButton")
        .disabled = true;
}


function resetVisualizer() {

    stopPlaying();

    visualizerArray =
        parseVisualizerArray();

    visualizerIndex = 0;

    visualizerLow = 0;

    visualizerHigh =
        visualizerArray.length - 1;

    visualizerFinished = false;

    visualizerComparisons = 0;

    visualizerSteps = 0;

    displayVisualizerArray();

    updateExecState(
        null,
        null,
        "Idle"
    );

    document.getElementById("visualizerMessage")
        .textContent =
        'Click "Next Step" or "Play" to start.';

    document.getElementById("stepButton")
        .disabled = false;

    document.getElementById("playButton")
        .disabled = false;
}


// ==============================
// NEXT STEP
// ==============================

function nextStep() {

    if (visualizerFinished) {
        return;
    }

    let algorithm =
        document.getElementById(
            "visualizerAlgorithm"
        ).value;

    let targetInput =
        document.getElementById(
            "targetValue"
        ).value;

    let target =
        parseInt(targetInput);

    if (Number.isNaN(target)) {

        document.getElementById(
            "visualizerMessage"
        ).textContent =
            "Enter a numeric target value first.";

        stopPlaying();

        return;
    }

    visualizerSteps++;

    // ==========================
    // LINEAR SEARCH
    // ==========================

    if (algorithm === "linear") {

        if (
            visualizerIndex >=
            visualizerArray.length
        ) {

            visualizerFinished = true;

            displayVisualizerArray();

            updateExecState(
                null,
                null,
                "Not Found"
            );

            document.getElementById(
                "visualizerMessage"
            ).textContent =
                "Target not found.";

            document.getElementById(
                "stepButton"
            ).disabled = true;

            stopPlaying();

            return;
        }

        let currentValue =
            visualizerArray[
                visualizerIndex
            ];

        visualizerComparisons++;

        if (currentValue === target) {

            displayVisualizerArray(
                -1,
                -1,
                visualizerIndex
            );

            updateExecState(
                visualizerIndex,
                currentValue,
                "Found"
            );

            document.getElementById(
                "visualizerMessage"
            ).textContent =
                "Target " +
                target +
                " found at index " +
                visualizerIndex +
                ".";

            visualizerFinished = true;

            document.getElementById(
                "stepButton"
            ).disabled = true;

            stopPlaying();

        } else {

            displayVisualizerArray(
                visualizerIndex
            );

            updateExecState(
                visualizerIndex,
                currentValue,
                "Searching"
            );

            document.getElementById(
                "visualizerMessage"
            ).textContent =
                "Checking index " +
                visualizerIndex +
                ": " +
                currentValue +
                " is not " +
                target +
                ".";

            visualizerIndex++;
        }

        return;
    }


    // ==========================
    // BINARY SEARCH
    // ==========================

    if (
        visualizerLow >
        visualizerHigh
    ) {

        visualizerFinished = true;

        displayVisualizerArray();

        updateExecState(
            null,
            null,
            "Not Found"
        );

        document.getElementById(
            "visualizerMessage"
        ).textContent =
            "Target not found.";

        document.getElementById(
            "stepButton"
        ).disabled = true;

        stopPlaying();

        return;
    }

    let middle =
        Math.floor(
            (visualizerLow +
                visualizerHigh) / 2
        );

    let middleValue =
        visualizerArray[middle];

    visualizerComparisons++;

    let eliminatedBefore =
        visualizerLow > 0
            ? [0, visualizerLow - 1]
            : null;

    let eliminatedAfter =
        visualizerHigh <
        visualizerArray.length - 1
            ? [
                visualizerHigh + 1,
                visualizerArray.length - 1
            ]
            : null;

    if (middleValue === target) {

        displayVisualizerArray(
            -1,
            -1,
            middle
        );

        updateExecState(
            middle,
            middleValue,
            "Found"
        );

        document.getElementById(
            "visualizerMessage"
        ).textContent =
            "Target " +
            target +
            " found at index " +
            middle +
            ".";

        visualizerFinished = true;

        document.getElementById(
            "stepButton"
        ).disabled = true;

        stopPlaying();

    } else if (middleValue < target) {

        displayVisualizerArray(
            -1,
            middle,
            -1,
            eliminatedBefore
        );

        updateExecState(
            middle,
            middleValue,
            "Searching"
        );

        document.getElementById(
            "visualizerMessage"
        ).textContent =
            middleValue +
            " is smaller than " +
            target +
            ". Searching the right half.";

        visualizerLow =
            middle + 1;

    } else {

        displayVisualizerArray(
            -1,
            middle,
            -1,
            eliminatedAfter
        );

        updateExecState(
            middle,
            middleValue,
            "Searching"
        );

        document.getElementById(
            "visualizerMessage"
        ).textContent =
            middleValue +
            " is greater than " +
            target +
            ". Searching the left half.";

        visualizerHigh =
            middle - 1;
    }
}


// ==============================
// PLAY / PAUSE
// ==============================

function speedToDelay(speedValue) {

    return 1200 -
        (speedValue - 1) * 220;
}


function playVisualizer() {

    if (visualizerFinished) {
        return;
    }

    document.getElementById("playButton")
        .disabled = true;

    document.getElementById("pauseButton")
        .disabled = false;

    let speedValue =
        parseInt(
            document.getElementById(
                "speedSlider"
            ).value
        );

    let delay =
        speedToDelay(
            Number.isNaN(speedValue)
                ? 3
                : speedValue
        );

    nextStep();

    visualizerPlayHandle =
        setInterval(function () {

            if (visualizerFinished) {

                stopPlaying();

                return;
            }

            nextStep();

        }, delay);
}


// ==============================
// BUTTON EVENTS
// ==============================

document.getElementById(
    "customCalcButton"
).addEventListener(
    "click",
    calculateCustomSize
);

document.getElementById(
    "runBenchmarkButton"
).addEventListener(
    "click",
    runMeasuredBenchmark
);

document.getElementById(
    "updateSizesButton"
).addEventListener(
    "click",
    updateReferenceSizes
);

document.getElementById(
    "resetButton"
).addEventListener(
    "click",
    resetPage
);

document.getElementById(
    "stepButton"
).addEventListener(
    "click",
    function () {

        stopPlaying();
        nextStep();
    }
);

document.getElementById(
    "playButton"
).addEventListener(
    "click",
    playVisualizer
);

document.getElementById(
    "pauseButton"
).addEventListener(
    "click",
    stopPlaying
);

document.getElementById(
    "visualizerReset"
).addEventListener(
    "click",
    resetVisualizer
);

document.getElementById(
    "randomizeButton"
).addEventListener(
    "click",
    randomizeVisualizerArray
);

document.getElementById(
    "visualizerAlgorithm"
).addEventListener(
    "change",
    resetVisualizer
);

document.getElementById(
    "arrayInput"
).addEventListener(
    "change",
    resetVisualizer
);


// ==============================
// TEST CASE CHANGE
// ==============================

document.getElementById(
    "testCase"
).addEventListener(
    "change",
    function () {

        computeComplexityTable();

        if (
            document.getElementById(
                "customLinearOps"
            ).textContent !== "—"
        ) {

            calculateCustomSize();
        }
    }
);


// ==============================
// INITIALIZE
// ==============================

resetVisualizer();

computeComplexityTable();

calculateCustomSize();