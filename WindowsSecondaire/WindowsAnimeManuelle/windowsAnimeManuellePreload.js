
window.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll("input[name='Adkami_linked']").forEach((input) => {
      input.addEventListener('change', radioChecked);
  });
})

function radioChecked(event)
{
    console.log('Checked radio with ID = ' + event.target.id);
}
