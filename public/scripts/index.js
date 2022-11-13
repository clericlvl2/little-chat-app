const socket = io();

const chatElement = document.querySelector('.chat');
const chatWindow = chatElement.querySelector('.chat__window');
const chatForm = chatElement.querySelector('.form');
const chatInput = chatElement.querySelector('.form__input');
const actionButton = chatElement.querySelector('.chat__action-btn');
const userList = chatElement.querySelector('.chat__user-list');
const notificationList = chatElement.querySelector('.chat__notification');

let thisUserData = null;
let isTyping = false;
let typingTimer = null;
const TYPING_STATE_DELAY = 3000;

const getUniqueId = () => {
  return Math.random().toString(32).slice(2);
};

const checkToken = function() {
  if (!sessionStorage.getItem('token')) {
    sessionStorage.setItem('token', getUniqueId());
    sessionStorage.setItem('username',`user-${sessionStorage.getItem('token')}`);
  }
};

const createInfoMessage = function(messageData) {
  const notificationElement = document.createElement('p');
  notificationElement.classList.add('chat__notification-message');
  notificationElement.id = `notification-${messageData.id}`;
  notificationElement.textContent = messageData.text;
  return notificationElement;
}

const addInfoMessage = function(notificationElement) {
  notificationList.append(notificationElement);
}

const removeInfoMessage = function(notificationElementId) {
  const infoMessageFullId = `notification-${notificationElementId}`
  const infoMessage = document.getElementById(infoMessageFullId);
  if (infoMessage) {
    infoMessage.remove();
  }
}

const createUserListItem = function(userData) {
  const userListItem = document.createElement('li');
  userListItem.classList.add('chat__user-list-item')
  userListItem.id = `user-list-${userData.id}`;
  userListItem.textContent = `${userData.name}: is online`;
  return userListItem;
}

const addUserListItem = function(userListItem) {
  userList.append(userListItem);
}

const createMessage = function({messageText, username, userId}) {
  const newMessage = document.createElement('li');
  const usernameElement = document.createElement('span');
  newMessage.classList.add('chat__message', userId);
  usernameElement.classList.add(`chat__message-author`);
  newMessage.textContent = messageText;
  usernameElement.textContent = `[${username}]: `;
  newMessage.prepend(usernameElement);
  return newMessage;
}

const addMessage = function(messageElement) {
  chatWindow.append(messageElement);
}

const handleMessage = function(messageData) {
  const newMessage = createMessage(messageData);
  addMessage(newMessage);
  window.scrollTo(0, document.body.scrollHeight);
}

const updateUserMessages = function(messageSelector, newUserName) {
  const userMessages = Array.from(chatWindow.querySelectorAll(`.${messageSelector}`));
  userMessages.forEach(message => {
    message.querySelector('.chat__message-author').textContent = `[${newUserName}]: `;
  });
}

const killTimerHandler = function() {
  isTyping = false;
  socket.emit('someoneIsTyping', {typingState: isTyping, typingUserName: thisUserData.name});
}

socket.on("connect", () => {
  thisUserData = new User(sessionStorage.getItem('token'), sessionStorage.getItem('username'));
  socket.emit('userConnected', thisUserData);
});

socket.on('chatMessage', messageText => {
  handleMessage(messageText);
});

socket.on('updateUsers', activeUsers => {
  userList.innerHTML = '';
  activeUsers.forEach(userdata => {
    const newUserListItem = createUserListItem(userdata);
    addUserListItem(newUserListItem);
  })
})

socket.on('updateMessages', updatedUserData => {
  updateUserMessages(updatedUserData.id, updatedUserData.name);
})

socket.on('areYouAlive', () => {
  socket.emit('iAmAlive', thisUserData);
});

socket.on('someoneIsTyping', (typingStateData) => {
  if (typingStateData.state) {
    const notificationData = {
      id: typingStateData.id,
      text: `${typingStateData.userName} is typing...`,
    }
    const newNotification = createInfoMessage(notificationData);
    addInfoMessage(newNotification);
  } else {
    removeInfoMessage(typingStateData.id);
  }
});

chatForm.addEventListener('submit', evt => {
  evt.preventDefault();
  if (chatInput.value) {
    killTimerHandler();
    const messageData = {
      messageText: chatInput.value,
      username: thisUserData.name,
      userId: thisUserData.id,
    }
    handleMessage(messageData);
    socket.emit('chatMessage', messageData);
    chatInput.value = '';
  }
});

chatInput.addEventListener('input', () => {
  if (!isTyping) {
    isTyping = true;
    typingTimer = setTimeout(killTimerHandler, TYPING_STATE_DELAY);
    const typingStateData = {
      state: isTyping,
      userName: thisUserData.name,
      userId: thisUserData.id
    }
    socket.emit('someoneIsTyping', typingStateData);
  } else {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(killTimerHandler, TYPING_STATE_DELAY);
  }
});

actionButton.addEventListener('click', () => {
  const newUserName = prompt('What\'s your name?', thisUserData.name);
  if (newUserName !== thisUserData.name) {
    updateUserMessages(thisUserData.id, newUserName);
    thisUserData.setName(newUserName);
    socket.emit('userParametersChanged', thisUserData);
  }
});

checkToken();
