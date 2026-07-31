const locationSelect = document.getElementById("location");
const viewConditionsButton = document.getElementById("view-conditions");
const resultsSection = document.getElementById("results");
const resultsTitle = document.getElementById("results-title");
const dataStatus = document.getElementById("data-status");

viewConditionsButton.addEventListener("click", () => {
    if (!locationSelect.value) {
        dataStatus.textContent =
            "Choose a location before viewing its conditions.";

        locationSelect.focus();
        return;
    }

    const selectedOption =
        locationSelect.options[locationSelect.selectedIndex];

    const locationName = selectedOption.textContent;

    resultsTitle.textContent = `${locationName} report`;

    dataStatus.textContent =
        `${locationName} is selected. Real rainfall and temperature ` +
        "data will be added in a later milestone.";

    resultsSection.scrollIntoView();
});