const socket = io();

const form = document.querySelector('.form');
const input = document.querySelector('.form__input');

form.addEventListener('submit', evt => {
  evt.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

socket.on('chat message', msg => {
  const list = document.querySelector('.chat__window');
  const listItem = document.createElement('li');
  listItem.textContent = msg;
  listItem.classList.add('chat__message');
  list.append(listItem);
  window.scrollTo(0, document.body.scrollHeight);
})