const saveButton = document.getElementById("save");
saveButton.addEventListener("click", () => {
    save();
});
function save() {
    localStorage.setItem("bestBrain", JSON.stringify(simulation.bestCar.brain));
}

const deleteButton = document.getElementById("delete");
deleteButton.addEventListener("click", () => {
    remove();
});
function remove() {
    localStorage.removeItem("bestBrain");
}
