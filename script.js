document.getElementById("changeColorButton").addEventListener("click", function () {
    const colors = ["#f4f4f4", "#ffcccb", "#d1ffd6", "#d6e7ff", "#fdfd96"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    document.body.style.backgroundColor = randomColor;
});
