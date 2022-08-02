import {authenticationV1} from "./index";

function signIn(authenticationInfoDto) {
    return authenticationV1.post("/token", authenticationInfoDto);
}

function signOut() {
    return authenticationV1.delete("/token");
}

function reissueToken(refreshToken) {
    return authenticationV1.post("/refresh-token", {
        headers: {
            "X-Auth-Refresh-Token": refreshToken
        }
    });
}

export {
    signIn,
    signOut,
    reissueToken
};