const form = document.getElementById("control-row");
const go = document.getElementById("go");
const input = document.getElementById("input");
const message = document.getElementById("message");

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


// populates the cache with the response from the chrome api on a get call
function ingestWithDomainFilter(cookies, domainFilter) {
 cache = []
 var cookieCount = 0;
 var subCookieCount = 0;

  for (var i in cookies) {

      if ( cookies[i].domain.toLowerCase() == domainFilter.toLowerCase() || cookies[i].domain.toLowerCase() == "." + domainFilter.toLowerCase()) {
        cache.push(cookies[i])

        cookieCount += 1;
        subCookieCount += 1;
      }
       else if (cookies[i].domain.startsWith(".") && isFilterMatch(domainFilter, cookies[i].domain)) {
          cache.push(cookies[i])
          cookieCount += 1;


      } else if (domainFilter.startsWith(".") && isFilterMatch(cookies[i].domain, domainFilter) ) {
          cache.push(cookies[i])
          cookieCount += 1;
      }
  
    }

   document.querySelector("#cookiecount").innerText = "found " + cookieCount + " cookie(s) in scope\n" +  "found " + subCookieCount + " matching subdomain\n";
   renderCookiesFromCache(document.querySelector('#cookieFilter').value);
}


// api wrapper to get all cookies and pass them onto the caching filter
function lookupCookies() {
	filter = document.querySelector("#domainFilter").value
	chrome.cookies.getAll({}, function(cookies) {
     // gets the cookies
      cookieSort(cookies)
    // sorts the cookies
   		ingestWithDomainFilter(cookies, filter) 
  });
