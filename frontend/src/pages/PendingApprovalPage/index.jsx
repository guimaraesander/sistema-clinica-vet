// Página de redirecionamento para o vendedor
import React from 'react';
import styles from './PendingApprovalPage.module.css';
import { Link } from 'react-router-dom';

const PendingApprovalPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cadastro Enviado!</h1>
        <p className={styles.message}>
          Obrigado por se cadastrar! Sua solicitação para se tornar um vendedor na TecnoBits está sendo analisada pela nossa equipe.
        </p>
        <p className={styles.message}>
          Você receberá um e-mail de confirmação assim que seu cadastro for aprovado.
        </p>
        <Link to="/" className={styles.homeButton}>Voltar para a Página Inicial</Link>
      </div>
    </div>
  );
};

export default PendingApprovalPage;