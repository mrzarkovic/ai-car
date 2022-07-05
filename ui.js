const saveButton = document.getElementById("save");
saveButton.addEventListener("click", () => {
    simulation.save();
});

const deleteButton = document.getElementById("delete");
deleteButton.addEventListener("click", () => {
    remove();
});
function remove() {
    localStorage.removeItem("bestBrain");
}

const restartButton = document.getElementById("restart");
restartButton.addEventListener("click", () => {
    simulation.restart();
});

const nextButton = document.getElementById("next");
nextButton.addEventListener("click", () => {
    simulation.nextLevel();
});
