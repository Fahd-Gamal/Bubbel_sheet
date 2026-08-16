const api = "https://bubblesheet.runasp.net/api";
let accessToken = null;
async function refreshToken() {
    try {
        const response = await fetch(
            `${api}/Account/refresh-token`,
            {
                method:"POST",
                credentials:"include"
            }
        );
        if(!response.ok)
            return false;
        accessToken = (await response.text()).replaceAll('"','');
        return true;
    } catch(error){
        console.error(error);
        return false;
    }
}
async function apiRequest(endpoint, options={}){
    let response = await fetch(
        `${api}${endpoint}`,
        {
            ...options,
            credentials:"include",
            headers:{
                ...(options.headers || {}),
                Authorization:`Bearer ${accessToken}`
            }
        }
    );
    if(response.status === 401){
        const refreshed = await refreshToken();
        if(!refreshed)
            return response;
        response = await fetch(
            `${api}${endpoint}`,
            {
                ...options,
                credentials:"include",
                headers:{
                    ...(options.headers || {}),
                    Authorization:`Bearer ${accessToken}`
                }
            }
        );
    }
    return response;
}