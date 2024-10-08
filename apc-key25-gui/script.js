function makeDraggable(element) {
    let offsetX, offsetY;

    element.onmousedown = function (e) {
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        document.onmousemove = moveElement;
        document.onmouseup = stopDragging;
    };

    function moveElement(e) {
        element.style.left = e.clientX - offsetX + 'px';
        element.style.top = e.clientY - offsetY + 'px';
    }

    function stopDragging() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function closeModule(button) {
    const frame = button.parentElement.parentElement; // Trouver le parent du bouton
    frame.style.display = 'none'; // Cacher le module
}

const modules = document.querySelectorAll('.keyboard, .pads, .Round-pads, .knobs, .console-view');
modules.forEach(module => {
    makeDraggable(module);
});

const closeButtons = document.querySelectorAll('.close-btn');
closeButtons.forEach(button => {
    button.onclick = () => {
        // Si tu veux fermer l'application
        const frame = button.parentElement.parentElement;
        frame.style.display = 'none'; // Cacher le module
        // remote.getCurrentWindow().close(); // Pour fermer complètement l'application
    };
});
