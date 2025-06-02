import {AxiosHeaders, AxiosRequestHeaders} from "axios";


export default function authHeader(): AxiosRequestHeaders {
    const localstorageUser = localStorage.getItem("user");
    if (!localstorageUser) {
        return new AxiosHeaders({});
    }
    const user = JSON.parse(localstorageUser);
    if (user && user.token) {
        return new AxiosHeaders({Authorization: `Token ${user.token}`});
    }
    return new AxiosHeaders({});
}
