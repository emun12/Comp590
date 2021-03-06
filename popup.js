const form = document.getElementById("control-row");
const go = document.getElementById("go");
const input = document.getElementById("input");
const message = document.getElementById("message");
// const output = document.getElementByID("a-cookie-existence");

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url) {
    try {
      let url = new URL(tab.url);
      input.value = url.hostname;
    } catch {}
  }

  input.focus();
})();

form.addEventListener("submit", handleFormSubmit);

async function handleFormSubmit(event) {
  event.preventDefault();

  clearMessage();

  let url = stringToUrl(input.value);
  if (!url) {
    setMessage("Invalid URL");
    return;
  }

  let message = await deleteDomainCookies(url.hostname);
  setMessage(message);
}

function stringToUrl(input) {
  // Start with treating the provided value as a URL
  try {
    return new URL(input);
  } catch {}
  // If that fails, try assuming the provided input is an HTTP host
  try {
    return new URL("http://" + input);
  } catch {}
  // If that fails ¯\_(ツ)_/¯
  return null;
}

async function deleteDomainCookies(domain) {
  let cookiesDeleted = 0;
  try {
    const cookies = await chrome.cookies.getAll({ domain });

    if (cookies.length === 0) {
      return "No cookies found";
    }

    let pending = cookies.map(deleteCookie);
    await Promise.all(pending);

    cookiesDeleted = pending.length;
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `Deleted ${cookiesDeleted} cookie(s).`;
}

function deleteCookie(cookie) {
  // Cookie deletion is largely modeled off of how deleting cookies works when using HTTP headers.
  // Specific flags on the cookie object like `secure` or `hostOnly` are not exposed for deletion
  // purposes. Instead, cookies are deleted by URL, name, and storeId. Unlike HTTP headers, though,
  // we don't have to delete cookies by setting Max-Age=0; we have a method for that ;)
  //
  // To remove cookies set with a Secure attribute, we must provide the correct protocol in the
  // details object's `url` property.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Secure
  const protocol = cookie.secure ? "https:" : "http:";

  // Note that the final URL may not be valid. The domain value for a standard cookie is prefixed
  // with a period (invalid) while cookies that are set to `cookie.hostOnly == true` do not have
  // this prefix (valid).
  // https://developer.chrome.com/docs/extensions/reference/cookies/#type-Cookie
  const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

  return chrome.cookies.remove({
    url: cookieUrl,
    name: cookie.name,
    storeId: cookie.storeId,
  });
}

function setMessage(str) {
  message.textContent = str;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = "";
}



// requesting optional permissions
document.querySelector('#optionalPermissions').addEventListener('click', (event) => {
  // Permissions must be requested from inside a user gesture, like a button's
  // click handler.
  chrome.permissions.request({
    permissions: ['tabs'],
    origins: ['https://www.google.com/']
  }, (granted) => {
    // The callback argument will be true if the user granted the permissions.
    if (granted) {
      

  // Adds a badge 
      chrome.action.setBadgeText({text: 'ON'});
      chrome.action.setBadgeBackgroundColor({color: '#a9d9d0'});
      alert("Optional permission granted");

    } else {
      // doSomethingElse();
      alert(" Optional permission denied");
    }
  });
});


// checks cookie current permissions

chrome.permissions.contains({
  permissions: ['tabs'],
  origins: ['https://www.google.com/']
}, (result) => {
  if (result) {
    // The extension has the permissions.
  } else {
    // The extension doesn't have the permissions.
  }
});


// Removing permissions 
const permissionToRemove = {
  permissions: ["tabs"]
}

function remove() {
  console.log("removing");
  chrome.permissions.remove(permissionToRemove).then(result => {
    console.log(result);
    alert("Permission removed");
   
  });


  // Removes badge 
  chrome.action.setBadgeText({text: ''});
}
document.querySelector("#remove").addEventListener("click", remove);



// function for getting the ID's of the cookie stores
document.querySelector('#cookiestore').addEventListener('click', (event) => {

  function logStores(cookieStores) {
    for (let store of cookieStores) {
      alert("This is a list of the cookie store IDs: " + store.id);
    }
  }

  let getting = chrome.cookies.getAllCookieStores();
  getting.then(logStores);

});


// function for checking if a cookie that starts with "reader=" exists
document.querySelector('#cookieexists').addEventListener('click', (event) => {
  const output = document.getElementById('a-cookie-existence')
  // In the original code, this parameter did not exist. The cookie parameter should be a string
  if (document.cookie.split(';').some((item) => item.trim().startsWith('username='))) {
    // the cookie parameter should be a string and includes what the cookie starts with. For example "reader="
    
    output.textContent = "The 'username' cookie does exist"
    
  } 
   //output.textContent = "The 'username' cookie does not exist"
  alert("The 'username' cookie does not exist")
  

});


// function for clearing cookies
document.querySelector('#go').addEventListener('click', (event) => {
  alert("Cookies have been cleared")
  
});
