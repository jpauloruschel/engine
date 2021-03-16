uniform sampler2D texture_sphereMap;
uniform RMEDP float material_reflectivity;

vec2 getDpAtlasUv(vec2 uv, float mip) {
    RMEDP vec4 rect;
    RMEDP float sx = saturate(mip - 2.0);
    rect.x = sx * 0.5;

    RMEDP float t = mip - rect.x * 6.0;
    RMEDP float i = 1.0 - rect.x;
    rect.y = min(t * 0.5, 0.75) * i + rect.x;

    RMEDP float st = saturate(t);
    rect.z = (1.0 - st * 0.5) * i;
    rect.w = rect.z * 0.5;

    RMEDP float rcRectZ = 1.0 / rect.z;
    RMEDP float scaleFactor = 0.00390625 * rcRectZ; // 0.0078125 = (256 + 2) / 256 - 1, 0.00390625 same for 512
    RMEDP vec2 scale = vec2(scaleFactor, scaleFactor * 2.0);
    uv = uv * (vec2(1.0) - scale) + scale * 0.5;

    uv = uv * rect.zw + rect.xy;

    return uv;
}

vec3 calcReflection(vec3 tReflDirW, float tGlossiness) {
    RMEDP vec3 reflDir = normalize(cubeMapProject(tReflDirW));

    // Convert vector to DP coords
    bool up = reflDir.y > 0.0;
    RMEDP float scale = 0.90909090909090909090909090909091;// 1.0 / 1.1;
    RMEDP vec3 reflDirWarp = reflDir.xzx * vec3(-0.25, 0.5, 0.25);
    RMEDP float reflDirVer = abs(reflDir.y) + 1.0;
    reflDirWarp /= reflDirVer;
    reflDirWarp *= scale;
    reflDirWarp = vec3(0.75, 0.5, 0.25) - reflDirWarp;
    RMEDP vec2 tc = up? reflDirWarp.xy : reflDirWarp.zy;

    RMEDP float bias = saturate(1.0 - tGlossiness) * 5.0; // multiply by max mip level

    RMEDP float mip = floor(bias);
    RMEDP vec3 tex1 = $texture2DSAMPLE(texture_sphereMap, getDpAtlasUv(tc, mip)).rgb;

    mip = min(mip + 1.0, 5.0);
    RMEDP vec3 tex2 = $texture2DSAMPLE(texture_sphereMap, getDpAtlasUv(tc, mip)).rgb;

    tex1 = mix(tex1, tex2, fract(bias));
    tex1 = processEnvironment(tex1);

    return tex1;
}

void addReflection() {   
    dReflection += vec4(calcReflection(dReflDirW, dGlossiness), material_reflectivity);
}
