export interface GpuPoints {
  render(t: number): void;
  mode: 'webgpu' | 'fallback2d';
}

export async function createGpuPoints(canvas: HTMLCanvasElement): Promise<GpuPoints> {
  const nav = navigator as any;
  if (!nav.gpu) {
    return createFallback2d(canvas);
  }
  try {
    const adapter = await nav.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return createFallback2d(canvas);
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    if (!context) return createFallback2d(canvas);
    const format = nav.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'premultiplied' });

    const pointCount = 5000;
    const positions = new Float32Array(pointCount * 3);
    const colors = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      const r = Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 4;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = z;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      colors[i * 3] = 0.5 + Math.random() * 0.5;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.3 + Math.random() * 0.3;
    }
    const posBuffer = device.createBuffer({
      size: positions.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Float32Array(posBuffer.getMappedRange()).set(positions);
    posBuffer.unmap();
    const colBuffer = device.createBuffer({
      size: colors.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Float32Array(colBuffer.getMappedRange()).set(colors);
    colBuffer.unmap();

    const uniformBuffer = device.createBuffer({
      size: 64 + 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = device.createBindGroupLayout({
      entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} }]
    });
    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout, entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
    });

    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    const shader = device.createShaderModule({
      code: `
        struct Uniforms { mvp: mat4x4f, time: f32 };
        @group(0) @binding(0) var<uniform> u: Uniforms;
        struct VSOut { @builtin(position) pos: vec4f, @location(0) col: vec3f };
        @vertex fn vs(@location(0) pos: vec3f, @location(1) col: vec3f) -> VSOut {
          var o: VSOut;
          o.pos = u.mvp * vec4f(pos, 1.0);
          o.col = col;
          return o;
        }
        @fragment fn fs(@location(0) col: vec3f) -> @location(0) vec4f {
          return vec4f(col, 1.0);
        }
      `
    });
    const pipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shader, entryPoint: 'vs',
        buffers: [
          { arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] },
          { arrayStride: 12, attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }] }
        ]
      },
      fragment: { module: shader, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'point-list' }
    });

    function mat4Perspective(fovy: number, aspect: number, near: number, far: number): Float32Array {
      const f = 1 / Math.tan(fovy / 2);
      const m = new Float32Array(16);
      m[0] = f / aspect; m[5] = f; m[10] = (far + near) / (near - far); m[11] = -1;
      m[14] = (2 * far * near) / (near - far); m[15] = 0;
      return m;
    }
    function mat4LookAt(eye: [number, number, number], center: [number, number, number], up: [number, number, number]): Float32Array {
      const f = [center[0]-eye[0], center[1]-eye[1], center[2]-eye[2]];
      const fl = Math.hypot(...f); const fn = f.map(v => v/fl);
      const s = cross(fn, up); const sl = Math.hypot(...s); const sn = s.map(v => v/sl);
      const u = cross(sn, fn);
      const m = new Float32Array(16);
      m[0]=sn[0]; m[1]=u[0]; m[2]=-fn[0]; m[3]=0;
      m[4]=sn[1]; m[5]=u[1]; m[6]=-fn[1]; m[7]=0;
      m[8]=sn[2]; m[9]=u[2]; m[10]=-fn[2]; m[11]=0;
      m[12]=-dot(sn,eye); m[13]=-dot(u,eye); m[14]=dot(fn,eye); m[15]=1;
      return m;
    }
    function cross(a: number[], b: number[]): number[] { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
    function dot(a: number[], b: number[]): number { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
    function mat4Mul(a: Float32Array, b: Float32Array): Float32Array {
      const m = new Float32Array(16);
      for (let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[i*4+k]*b[k*4+j];m[i*4+j]=s;}
      return m;
    }
    function mat4RotateY(m: Float32Array, rad: number): Float32Array {
      const c=Math.cos(rad), s=Math.sin(rad);
      const r=new Float32Array([c,0,s,0, 0,1,0,0, -s,0,c,0, 0,0,0,1]);
      return mat4Mul(r,m);
    }

    let lastT = 0;
    return {
      mode: 'webgpu',
      render(t: number): void {
        const w = canvas.width, h = canvas.height;
        const aspect = w / h;
        const proj = mat4Perspective(Math.PI/3, aspect, 0.1, 200);
        const view = mat4LookAt([25,15,25], [0,0,0], [0,1,0]);
        const model = mat4RotateY(new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]), t * 0.15);
        const mvp = mat4Mul(proj, mat4Mul(view, model));
        const uniform = new Float32Array(17);
        uniform.set(mvp);
        uniform[16] = t;
        device.queue.writeBuffer(uniformBuffer, 0, uniform);

        const pass = device.queue.beginRenderPass({
          colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: { r: 0.04, g: 0.05, b: 0.07, a: 1 }, loadOp: 'clear', storeOp: 'store' }]
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.setVertexBuffer(0, posBuffer);
        pass.setVertexBuffer(1, colBuffer);
        pass.draw(pointCount);
        pass.end();
        device.queue.submit([]);
      }
    };
  } catch {
    return createFallback2d(canvas);
  }
}

function createFallback2d(canvas: HTMLCanvasElement): GpuPoints {
  const ctx = canvas.getContext('2d')!;
  const points = Array.from({ length: 3000 }, () => ({
    x: (Math.random() - 0.5) * 20,
    y: (Math.random() - 0.5) * 10,
    z: (Math.random() - 0.5) * 20,
    c: `hsl(${160 + Math.random()*40}, 70%, ${40+Math.random()*40}%)`
  }));
  let rot = 0;
  return {
    mode: 'fallback2d',
    render(t: number): void {
      rot = t * 0.1;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0b0e11';
      ctx.fillRect(0, 0, w, h);
      const cx = w/2, cy = h/2, scale = Math.min(w,h)*0.8;
      for (const p of points) {
        const xr = p.x * Math.cos(rot) - p.z * Math.sin(rot);
        const zr = p.x * Math.sin(rot) + p.z * Math.cos(rot);
        const px = cx + xr * scale / 30;
        const py = cy + (p.y + zr * 0.3) * scale / 30;
        ctx.fillStyle = p.c;
        ctx.fillRect(px, py, 1.5, 1.5);
      }
      ctx.fillStyle = '#d8dade';
      ctx.font = '10px monospace';
      ctx.fillText('WEBGPU UNAVAILABLE — CPU FALLBACK', 10, 20);
    }
  };
}