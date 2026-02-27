import { prisma } from '../config/prisma.js';



//garantir que so usuarios permitidos mudem status
export const canUpdateStatus = ( req, res, next ) => {

    const userRole = req.user.role;
    const novoStatus = req.body.status; 

//cliente cancela ou devolve
    if(["CANCELADO", "DEVOLVIDO"].includes(novoStatus) && userRole === "cliente") return next();

//vendedor atualiza como em_preparacao ou enviado
    if(["EM_PREPARACAO", "ENVIADO"].includes(novoStatus) && userRole === "vendedor") return next();

//admin tem poder absoluto ( altera tudo)
    if(userRole === "admin") return next();

    return res.status(403).json( {message: "voce nao pode alterar para esse status!"});
};