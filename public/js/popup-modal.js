// Get the modal
var modal = document.getElementById('myModal');

// Get the image and insert it inside the modal - use its "alt" text as a caption
var img = document.getElementById('myImg');
var dialog = document.getElementById('dialog');
var show = document.getElementById('show-details');
var captionText = document.getElementById("caption");
var counter = 0;
function popup(to_popup) {
    return function () {
        modal.style.display = "block";
        captionText.innerHTML = to_popup.innerHTML;
        setTimeout(function () {
            counter = 1;
        }, 500);
    }
};

show.onclick = popup(dialog);
$(document).click(function () {
    if (counter == 1) {
        counter = 0;
        modal.style.display = "none";
        //console.log("close img");
    }
});
