import {authenticationV1} from "./index";
import {AuthenticationInfoDto, TokenDto} from "@/models/authentication/authentication.dtos";

function signIn(authenticationInfoDto: AuthenticationInfoDto) {
    return authenticationV1.post("/token", authenticationInfoDto);
}

function signOut() {
    return authenticationV1.delete("/token");
}

function reissueToken(refreshToken: string) {
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