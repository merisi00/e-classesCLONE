require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexão com o Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Middlewares
app.use(cors());
app.use(express.json());

// Relação entre os nomes usados na API e as tabelas do Supabase
const recursos = {
    jogos: {
        tabela: 'games',
        nome: 'Jogo'
    },
    times: {
        tabela: 'teams',
        nome: 'Time'
    },
    competidores: {
        tabela: 'competitors',
        nome: 'Competidor'
    },
    confrontos: {
        tabela: 'matches',
        nome: 'Confronto'
    }
};

// Verifica se o recurso existe
function obterRecurso(nome) {
    return recursos[nome] || null;
}

// Tratamento padrão de erros
function tratarErro(res, erro) {
    console.error('Erro:', erro);

    return res.status(500).json({
        erro: erro.message || 'Erro interno do servidor'
    });
}

// Rota inicial
app.get('/', (req, res) => {
    res.status(200).json({
        mensagem: 'Bem-vindo à API GamerClass',
        status: 'sucesso',
        rotas: [
            '/api/jogos',
            '/api/times',
            '/api/competidores',
            '/api/confrontos'
        ]
    });
});

// =====================================================
// GET - LISTAR TODOS OS REGISTROS
// =====================================================

app.get('/api/:recurso', async (req, res) => {
    const recurso = obterRecurso(req.params.recurso);

    if (!recurso) {
        return res.status(404).json({
            erro: 'Recurso não encontrado'
        });
    }

    try {
        const { data, error } = await supabase
            .from(recurso.tabela)
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            return tratarErro(res, error);
        }

        return res.status(200).json(data);
    } catch (erro) {
        return tratarErro(res, erro);
    }
});

// =====================================================
// GET - BUSCAR UM REGISTRO PELO ID
// =====================================================

app.get('/api/:recurso/:id', async (req, res) => {
    const recurso = obterRecurso(req.params.recurso);

    if (!recurso) {
        return res.status(404).json({
            erro: 'Recurso não encontrado'
        });
    }

    try {
        const { data, error } = await supabase
            .from(recurso.tabela)
            .select('*')
            .eq('id', req.params.id)
            .maybeSingle();

        if (error) {
            return tratarErro(res, error);
        }

        if (!data) {
            return res.status(404).json({
                erro: `${recurso.nome} não encontrado`
            });
        }

        return res.status(200).json(data);
    } catch (erro) {
        return tratarErro(res, erro);
    }
});

// =====================================================
// POST - CRIAR REGISTRO
// =====================================================

app.post('/api/:recurso', async (req, res) => {
    const recurso = obterRecurso(req.params.recurso);

    if (!recurso) {
        return res.status(404).json({
            erro: 'Recurso não encontrado'
        });
    }

    try {
        // O id é criado automaticamente pelo Supabase
        const {
            id,
            created_at,
            ...dados
        } = req.body;

        const { data, error } = await supabase
            .from(recurso.tabela)
            .insert(dados)
            .select()
            .single();

        if (error) {
            return tratarErro(res, error);
        }

        return res.status(201).json(data);
    } catch (erro) {
        return tratarErro(res, erro);
    }
});

// =====================================================
// PUT - ATUALIZAR REGISTRO
// =====================================================

app.put('/api/:recurso/:id', async (req, res) => {
    const recurso = obterRecurso(req.params.recurso);

    if (!recurso) {
        return res.status(404).json({
            erro: 'Recurso não encontrado'
        });
    }

    try {
        // Não permite alterar o id nem a data de criação
        const {
            id,
            created_at,
            ...dados
        } = req.body;

        const { data, error } = await supabase
            .from(recurso.tabela)
            .update(dados)
            .eq('id', req.params.id)
            .select()
            .maybeSingle();

        if (error) {
            return tratarErro(res, error);
        }

        if (!data) {
            return res.status(404).json({
                erro: `${recurso.nome} não encontrado`
            });
        }

        return res.status(200).json(data);
    } catch (erro) {
        return tratarErro(res, erro);
    }
});

// =====================================================
// DELETE - EXCLUIR REGISTRO
// =====================================================

app.delete('/api/:recurso/:id', async (req, res) => {
    const recurso = obterRecurso(req.params.recurso);

    if (!recurso) {
        return res.status(404).json({
            erro: 'Recurso não encontrado'
        });
    }

    try {
        const { data, error } = await supabase
            .from(recurso.tabela)
            .delete()
            .eq('id', req.params.id)
            .select()
            .maybeSingle();

        if (error) {
            return tratarErro(res, error);
        }

        if (!data) {
            return res.status(404).json({
                erro: `${recurso.nome} não encontrado`
            });
        }

        return res.status(204).send();
    } catch (erro) {
        return tratarErro(res, erro);
    }
});

// Rota para endereços inexistentes
app.use((req, res) => {
    res.status(404).json({
        erro: 'Rota não encontrada'
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}` );
});
