import { jest } from "@jest/globals";

const caixaServiceMock = {
  abrirCaixaService: jest.fn(),
  obterCaixaAtualService: jest.fn(),
  fecharCaixaService: jest.fn(),
  obterResumoCaixaService: jest.fn(),
};

const vendaServiceMock = {
  criarVendaService: jest.fn(),
  listarVendasService: jest.fn(),
  obterVendaPorIdService: jest.fn(),
  registrarPagamentoVendaService: jest.fn(),
};

jest.unstable_mockModule("../services/caixaService.js", () => caixaServiceMock);
jest.unstable_mockModule("../services/vendaService.js", () => vendaServiceMock);

const { default: app } = await import("../../app.js");

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}`,
      });
    });
  });
}

describe("Rotas PDV", () => {
  let server;
  let baseUrl;
  let consoleErrorSpy;

  beforeAll(async () => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const started = await startServer();
    server = started.server;
    baseUrl = started.baseUrl;
  });

  afterAll(async () => {
    consoleErrorSpy.mockRestore();
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/caixa/open deve rejeitar payload invalido com 400", async () => {
    const response = await fetch(`${baseUrl}/api/caixa/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valorInicial: 10 }),
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(caixaServiceMock.abrirCaixaService).not.toHaveBeenCalled();
  });

  it("POST /api/caixa/open deve abrir caixa com payload valido", async () => {
    caixaServiceMock.abrirCaixaService.mockResolvedValue({
      id: "cx_1",
      status: "ABERTO",
      valorInicial: 100,
    });

    const response = await fetch(`${baseUrl}/api/caixa/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuarioId: "usr_1",
        valorInicial: 100,
        campoInutil: "deve ser removido",
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(caixaServiceMock.abrirCaixaService).toHaveBeenCalledWith({
      usuarioId: "usr_1",
      valorInicial: 100,
    });
  });

  it("POST /api/vendas deve rejeitar itens vazios com 400", async () => {
    const response = await fetch(`${baseUrl}/api/vendas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuarioId: "usr_1",
        itens: [],
      }),
    });

    expect(response.status).toBe(400);
    expect(vendaServiceMock.criarVendaService).not.toHaveBeenCalled();
  });

  it("POST /api/vendas/:id/pagamentos deve normalizar forma para maiusculo", async () => {
    vendaServiceMock.registrarPagamentoVendaService.mockResolvedValue({
      vendaId: "ven_1",
      statusVenda: "PENDENTE",
    });

    const response = await fetch(`${baseUrl}/api/vendas/ven_1/pagamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuarioId: "usr_1",
        forma: "pix",
        valor: 25,
      }),
    });

    expect(response.status).toBe(201);
    expect(vendaServiceMock.registrarPagamentoVendaService).toHaveBeenCalledWith({
      vendaId: "ven_1",
      usuarioId: "usr_1",
      forma: "PIX",
      valor: 25,
    });
  });
});
