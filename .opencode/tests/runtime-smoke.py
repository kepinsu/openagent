"""Opt-in discovery check using a private V2 server and disposable configuration.

No prompts are sent and no personal configuration or credentials are copied.
Failure artifacts are kept for diagnosis; successful workspaces are removed.
"""
import os, pathlib, shutil, subprocess, tempfile, selectors, time, re, json, secrets
source = pathlib.Path(__file__).resolve().parents[1]
temporary_parent = '/tmp/opencode' if pathlib.Path('/tmp/opencode').is_dir() else None
root = pathlib.Path(tempfile.mkdtemp(prefix='openagent-v2-smoke-', dir=temporary_parent))
project = root/'project'; project.mkdir(); (project/'.git').mkdir()
target = project/'.opencode'; target.mkdir()
for name in ('agents','commands','skills','plugins'):
    shutil.copytree(source/name, target/name)
for name in ('package.json','package-lock.json'):
    shutil.copy2(source/name, target/name)
(target/'node_modules').symlink_to(source/'node_modules', target_is_directory=True)
(target/'opencode.jsonc').write_text(json.dumps({'default_agent':'core/opencoder-go','experimental':{'subagent_depth':3}}))
env = dict(os.environ)
for key in tuple(env):
    if key.startswith('OPENCODE_'): env.pop(key)
env.update(HOME=str(root/'home'), XDG_CONFIG_HOME=str(root/'config'), XDG_DATA_HOME=str(root/'data'), XDG_CACHE_HOME=str(root/'cache'), XDG_STATE_HOME=str(root/'state'))
env['OPENCODE_PASSWORD'] = secrets.token_hex(24)
binary=shutil.which('opencode')
if not binary:
    raise SystemExit('Install OpenCode 2.0.29 and put opencode on PATH first.')
passed = False
server=subprocess.Popen([binary,'serve','--hostname','127.0.0.1','--port','0'],cwd=project,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
try:
    sel=selectors.DefaultSelector(); sel.register(server.stdout,selectors.EVENT_READ)
    deadline=time.monotonic()+45; url=None
    while time.monotonic()<deadline:
        if server.poll() is not None: raise RuntimeError('server exited')
        for key,_ in sel.select(timeout=1):
            line=key.fileobj.readline()
            match=re.search(r'http://127\.0\.0\.1:\d+',line)
            if match: url=match.group(); break
        if url: break
    if not url: raise RuntimeError('server startup URL not received')
    query='?location%5Bdirectory%5D='+str(project)
    for name in ('plugin','agent','skill','command'):
        expected={'plugin':'openagent.agent-router','agent':'core/opencoder-go','skill':'task-management','command':'open-prompt'}[name]
        ready_deadline=time.monotonic()+30
        while True:
            # CLI output can exceed pipe buffers for skills with full content.
            with tempfile.TemporaryFile(mode='w+') as output:
                subprocess.run([binary,'api','--server',url,'get','/api/'+name+query],cwd=project,env=env,stdout=output,check=True,text=True,timeout=60)
                output.seek(0)
                data=json.load(output)['data']
            if any(x.get('id',x.get('name'))==expected for x in data) or time.monotonic()>=ready_deadline: break
            time.sleep(0.5)
        if name=='plugin':
            router=[x for x in data if x['id']=='openagent.agent-router']; print('router:',router,flush=True)
            assert len(router)==1 and router[0]['state']['status']=='active'
        else:
            ids=[x.get('id',x.get('name')) for x in data]; print(name+':',ids,flush=True)
            if name=='agent': assert 'core/opencoder-go' in ids and 'subagents/core/batch-executor' in ids
            if name=='skill': assert 'task-management' in ids and 'golang-testing' in ids and 'context7' in ids
            if name=='command': assert 'open-prompt' in ids
    print('Isolated V2 runtime discovery passed.',flush=True)
    passed = True
finally:
    server.terminate()
    try: server.wait(timeout=10)
    except subprocess.TimeoutExpired: server.kill(); server.wait()
    if passed:
        shutil.rmtree(root)
    else:
        print('Smoke workspace:',root,flush=True)
