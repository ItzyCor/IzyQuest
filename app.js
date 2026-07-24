const SUPABASE_URL = "https://ixomaoyjjffuxxgqxibm.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_Aiq1G_bdf_NTGU6Hf4T9wQ_SWkB8tVL"; 

let supabaseClient = null;
try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.error("Error al iniciar Supabase", e);
}

let workspaces = JSON.parse(localStorage.getItem('workspaces')) || [];
let currentWorkspaceId = null;
let selectedColor = "rgba(6, 182, 212, 0.3)";
let currentTaskFile = null; // Variable para almacenar el archivo temporalmente
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    name: "¡Hola!",
    avatar: "🦝", 
    xp: 0,
    level: 1
};

let pomoTimeLeft = 25 * 60;
let pomoTimerId = null;
let isPomoRunning = false;

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    setupColorSelection();
    setupAvatarUpload(); 
    renderLobby();
    updateProfileUI(); 
});

window.selectColor = (color) => {
    selectedColor = color;
};

function setupAvatarUpload() {
    const input = document.getElementById('profile-pic-input');
    if (!input) return;

    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                userProfile.avatar = event.target.result;
                saveData(); 
                updateProfileUI();
                const preview = document.getElementById('modal-avatar-preview');
                if (preview) {
                    preview.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

window.selectAvatar = (element, avatar) => {
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    userProfile.avatar = avatar;
    const preview = document.getElementById('modal-avatar-preview');
    if (preview) preview.innerHTML = avatar;
    saveData(); 
    updateProfileUI();
};

window.openProfileSettings = () => {
    const modal = document.getElementById('modal-profile-settings');
    if (modal) {
        modal.style.display = 'flex';
        const input = document.getElementById('profile-name-input');
        if (input) input.value = userProfile.name.replace("¡Hola, ", "").replace("!", "").trim();
        const preview = document.getElementById('modal-avatar-preview');
        if (preview) {
            if (userProfile.avatar.startsWith('data:image')) {
                preview.innerHTML = `<img src="${userProfile.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                preview.innerHTML = userProfile.avatar;
            }
        }
    }
};

window.saveProfile = () => {
    const input = document.getElementById('profile-name-input');
    if (input) {
        const rawName = input.value.trim();
        userProfile.name = `¡Hola, ${rawName || 'Estudiante'}!`;
    }
    updateProfileUI();
    saveData();
    const modal = document.getElementById('modal-profile-settings');
    if (modal) modal.style.display = 'none';
};

window.showTaskDetail = (taskId, workspaceId) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (!ws) return;
    const task = ws.tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('modal-task-detail');
    if (modal) {
        modal.style.display = 'flex';
        const fileDisplay = task.file_url 
            ? `<a href="${task.file_url}" target="_blank" download="recurso" style="display:block; margin-top:10px; color:#00f3ff; text-decoration:underline;">Ver/Descargar Recurso Adjunto</a>` 
            : '<p style="color:#64748b; font-size:0.8rem;">Sin archivo adjunto</p>';
            
        const linkDisplay = task.link
            ? `<a href="${task.link}" target="_blank" style="display:block; margin-top:10px; color:#3b82f6;">Ir al enlace de apoyo</a>`
            : '';

        modal.innerHTML = `
            <div class="glass-card" style="width: 400px; padding: 25px; color: white; background: #1e293b; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                <h2 style="color: #00f3ff; margin-top:0;">${task.title}</h2>
                <div style="margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                    <p style="margin:0; font-size: 0.9rem; color: #94a3b8;">Descripción:</p>
                    <p style="margin: 5px 0 0 0;">${task.description || 'Sin descripción'}</p>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap:wrap;">
                    <span style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px;">Materia: ${ws.name}</span>
                    <span style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; text-transform:capitalize;">Prioridad: ${task.priority}</span>
                </div>
                ${fileDisplay}
                ${linkDisplay}
                <button onclick="document.getElementById('modal-task-detail').style.display='none'" class="btn-primary" style="width:100%; cursor:pointer; margin-top: 15px;">Cerrar</button>
            </div>
        `;
    }
};

function setupColorSelection() {
    const colorDots = document.querySelectorAll('.color-dot');
    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            window.selectColor(dot.getAttribute('data-color'));
        });
    });
}

function setupEventListeners() {
    document.getElementById('btn-start')?.addEventListener('click', () => switchScreen('lobby-screen'));
    document.getElementById('btn-back-lobby')?.addEventListener('click', () => {
        switchScreen('lobby-screen');
        currentWorkspaceId = null;
        renderLobby();
    });
    document.getElementById('btn-trigger-profile')?.addEventListener('click', window.openProfileSettings);
    document.getElementById('btn-open-settings')?.addEventListener('click', window.openProfileSettings);
    document.getElementById('close-profile-modal')?.addEventListener('click', () => document.getElementById('modal-profile-settings').style.display = 'none');
    document.getElementById('btn-save-profile')?.addEventListener('click', window.saveProfile);
    document.getElementById('btn-open-workspace-modal')?.addEventListener('click', () => document.getElementById('modal-new-workspace').style.display = 'flex');
    document.getElementById('close-workspace-modal')?.addEventListener('click', () => document.getElementById('modal-new-workspace').style.display = 'none');
    document.getElementById('btn-create-workspace')?.addEventListener('click', handleCreateWorkspace);
    document.getElementById('task-form')?.addEventListener('submit', handleTaskSubmit);
    document.getElementById('btn-toggle-pomo')?.addEventListener('click', togglePomodoro);

    const fileInput = document.getElementById('task-file');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    currentTaskFile = event.target.result; // Guardamos el base64
                    const preview = document.getElementById('file-name-preview');
                    if (preview) preview.textContent = file.name;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function saveData() {
    localStorage.setItem('workspaces', JSON.stringify(workspaces));
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

function renderLobby() {
    const grid = document.getElementById('workspaces-grid');
    const compGrid = document.getElementById('workspaces-completed-grid');
    if (!grid || !compGrid) return;
    grid.innerHTML = '';
    compGrid.innerHTML = '';
    workspaces.forEach(ws => {
        const div = document.createElement('div');
        div.className = 'workspace-card';
        div.style.background = ws.color || "rgba(6, 182, 212, 0.3)";
        div.style.padding = "20px";
        div.style.borderRadius = "12px";
        div.style.cursor = "pointer";
        div.onclick = () => window.openWorkspace(ws.id);
        div.innerHTML = `<h3>${ws.name}</h3>
                         <button onclick="event.stopPropagation(); window.deleteWorkspace('${ws.id}')" style="margin-top: 10px; padding: 4px 8px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fff; border-radius: 4px; cursor: pointer;">Eliminar</button>`;
        grid.appendChild(div);
        (ws.tasks || []).filter(t => t.status === 'terminada').forEach(t => {
            const c = document.createElement('div');
            c.className = 'task-item priority-' + (t.priority || 'baja');
            c.style.cursor = "pointer";
            c.onclick = (e) => { e.stopPropagation(); window.showTaskDetail(t.id, ws.id); };
            c.innerHTML = `<span>${t.title}</span><small style="color: #64748b; display:block;">${ws.name}</small>`;
            compGrid.appendChild(c);
        });
    });
}

function renderTasks() {
    const list = document.getElementById('tasks-list');
    const doneList = document.getElementById('completed-tasks-list');
    if (!list || !doneList) return;
    list.innerHTML = '';
    doneList.innerHTML = '';
    const ws = workspaces.find(w => w.id === currentWorkspaceId);
    if (!ws || !ws.tasks) return;
    ws.tasks.forEach(t => {
        const item = document.createElement('div');
        item.className = 'task-item priority-' + (t.priority || 'baja');
        item.style.cursor = "pointer";
        item.onclick = () => window.showTaskDetail(t.id, ws.id);
        if (t.status === 'pendiente') {
            item.innerHTML = `<span>${t.title}</span>
                              <button onclick="event.stopPropagation(); window.completeTask('${t.id}')" style="padding: 4px 8px; background: #22c55e; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Completar</button>`;
            list.appendChild(item);
        } else {
            item.innerHTML = `<span>${t.title}</span><span style="color:#22c55e;">✅</span>`;
            doneList.appendChild(item);
        }
    });
}

window.switchScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
};

window.openWorkspace = (id) => {
    currentWorkspaceId = id;
    const wsTitle = document.getElementById('current-workspace-title');
    if(wsTitle) wsTitle.textContent = workspaces.find(w => w.id === id)?.name || "Materia";
    window.switchScreen('workspace-detail-screen');
    renderTasks();
};

async function handleCreateWorkspace() {
    const nameInput = document.getElementById('workspace-name-input');
    if (!nameInput?.value.trim()) return;
    
    const newWs = { 
        id: crypto.randomUUID(), 
        name: nameInput.value.trim(), 
        color: selectedColor, 
        tasks: [] 
    };
    
    const { tasks, ...workspaceForSupabase } = newWs;
    
    if (supabaseClient) {
        const { error } = await supabaseClient.from('workspaces').insert([workspaceForSupabase]);
        if (error) {
            console.error("Error al insertar en Supabase:", error);
            return;
        }
    }
    
    workspaces.push(newWs);
    saveData();
    renderLobby();
    nameInput.value = '';
    document.getElementById('modal-new-workspace').style.display = 'none';
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    if (!title) return;
    
    const dateVal = document.getElementById('task-date')?.value;

    const taskData = {
        id: crypto.randomUUID(), 
        workspace_id: currentWorkspaceId,
        title: title,
        description: document.getElementById('task-desc')?.value.trim() || '',
        due_date: dateVal ? new Date(dateVal).toISOString() : null, 
        priority: document.getElementById('task-priority').value || 'baja',
        status: 'pendiente',
        link: document.getElementById('task-link')?.value || null,
        file_url: currentTaskFile // Usamos el archivo cargado
    };

    if (supabaseClient) {
        const { error } = await supabaseClient.from('tasks').insert([taskData]);
        if (error) {
            console.error("Error al guardar en Supabase:", error);
            return;
        }
    }

    const ws = workspaces.find(w => w.id === currentWorkspaceId);
    if (ws) {
        if (!ws.tasks) ws.tasks = [];
        ws.tasks.push(taskData);
        saveData();
        renderTasks();
        e.target.reset();
        currentTaskFile = null; // Limpiar variable de archivo
        document.getElementById('file-name-preview').textContent = 'Ningún archivo seleccionado';
    }
}

window.deleteWorkspace = async (id) => {
    if (supabaseClient) await supabaseClient.from('workspaces').delete().eq('id', id);
    workspaces = workspaces.filter(w => w.id !== id);
    saveData();
    renderLobby();
};

window.completeTask = async (taskId) => {
    if (supabaseClient) await supabaseClient.from('tasks').update({ status: 'terminada' }).eq('id', taskId);
    const ws = workspaces.find(w => w.id === currentWorkspaceId);
    if (ws && ws.tasks) {
        const t = ws.tasks.find(x => x.id === taskId);
        if (t) t.status = 'terminada';
    }
    userProfile.xp += 30;
    updateProfileUI();
    saveData();
    renderTasks();
};

function updateProfileUI() {
    const nameEl = document.getElementById('display-user-name');
    const levelEl = document.getElementById('display-user-level-text'); 
    const avatarEl = document.getElementById('user-avatar-display');
    
    if (nameEl) nameEl.textContent = userProfile.name;
    if (levelEl) levelEl.textContent = `Nivel ${userProfile.level} (Mapache Aprendiz)`;
    
    if (avatarEl) {
        if (userProfile.avatar.startsWith('data:image')) {
            avatarEl.innerHTML = `<img src="${userProfile.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
            avatarEl.textContent = userProfile.avatar;
        }
    }
}

function togglePomodoro() {
    const btn = document.getElementById('btn-toggle-pomo');
    if (!btn) return;
    if (isPomoRunning) {
        clearInterval(pomoTimerId);
        btn.innerHTML = '<i class="ph ph-play"></i>';
        isPomoRunning = false;
    } else {
        isPomoRunning = true;
        btn.innerHTML = '<i class="ph ph-pause"></i>';
        pomoTimerId = setInterval(() => {
            pomoTimeLeft--;
            const mins = Math.floor(pomoTimeLeft / 60);
            const secs = pomoTimeLeft % 60;
            const timerEl = document.getElementById('pomo-timer');
            if (timerEl) timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            if (pomoTimeLeft <= 0) {
                clearInterval(pomoTimerId);
                isPomoRunning = false;
                btn.innerHTML = '<i class="ph ph-play"></i>';
                pomoTimeLeft = 25 * 60;
            }
        }, 1000);
    }
}