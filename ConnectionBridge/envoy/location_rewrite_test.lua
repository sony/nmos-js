-- Unit tests for location_rewrite.lua (Lua 5.1 / LuaJIT).
-- Run from this directory: lua5.1 location_rewrite_test.lua

local rewrite = require("location_rewrite")

local failures = 0

local function fail(msg)
    failures = failures + 1
    io.stderr:write("FAIL: " .. msg .. "\n")
end

local function assert_eq(expected, actual, label)
    if actual ~= expected then
        fail(
            string.format(
                "%s\n  expected: %s\n  actual:   %s",
                label,
                tostring(expected),
                tostring(actual)
            )
        )
    end
end

local function assert_nil(actual, label)
    if actual ~= nil then
        fail(string.format("%s\n  expected: nil\n  actual:   %s", label, tostring(actual)))
    end
end

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

do
    local suffix, rest = rewrite.path_suffix_after(
        "/x-nmos/connection/v1.1/single/receivers/r1",
        "/x-nmos/connection/v1.1"
    )
    assert_eq("/single/receivers/r1", suffix, "path_suffix_after under prefix")
    assert_eq("", rest, "path_suffix_after no query")
end

do
    local suffix, rest = rewrite.path_suffix_after(
        "/x-nmos/connection/v1.1?x=1",
        "/x-nmos/connection/v1.1"
    )
    assert_eq("", suffix, "path_suffix_after exact path")
    assert_eq("?x=1", rest, "path_suffix_after keeps query")
end

assert_nil(
    rewrite.path_suffix_after("/x-manifest/foo", "/x-nmos/connection/v1.1"),
    "path_suffix_after outside prefix"
)

-- RFC 3986 §5.2.4 worked examples
assert_eq("/a/g", rewrite.remove_dot_segments("/a/b/c/./../../g"), "RFC 3986 §5.2.4 /a/b/c/./../../g")
assert_eq("mid/6", rewrite.remove_dot_segments("mid/content=5/../6"), "RFC 3986 §5.2.4 mid/content=5/../6")
-- Empty segments (segment = *pchar) and trailing slash via 2E
assert_eq("/a/b/", rewrite.remove_dot_segments("/a/b/"), "remove_dot_segments trailing slash")
assert_eq("/a/b//c", rewrite.remove_dot_segments("/a/b//c"), "remove_dot_segments mid-path empty segment")
assert_eq("//", rewrite.remove_dot_segments("//"), "remove_dot_segments two empty segments")
assert_eq("/a/", rewrite.remove_dot_segments("/a/b//c/../../.."), "remove_dot_segments empty segment then ..")
assert_eq("/a/c", rewrite.remove_dot_segments("/a/b/../c"), "remove_dot_segments ..")
assert_eq("/", rewrite.remove_dot_segments("/."), "remove_dot_segments /.")
assert_eq("/", rewrite.remove_dot_segments("/.."), "remove_dot_segments /..")
-- §5.4.2 path-absolute abnormal (remove_dot_segments only)
assert_eq("/g", rewrite.remove_dot_segments("/./g"), "RFC 3986 §5.4.2 /./g")
assert_eq("/g", rewrite.remove_dot_segments("/../g"), "RFC 3986 §5.4.2 /../g")

-- RFC 3986 §5.4.1 / §5.4.2 path-relative examples (base URI http://a/b/c/d;p?q).
-- Assert path + query/fragment only (no scheme/host). Skip scheme, authority,
-- path-absolute, query-only, fragment-only, and empty-reference rows.
local RFC3986_BASE_PATH = "/b/c/d;p"

local function assert_resolve(ref, expected_pathquery, label)
    assert_eq(
        expected_pathquery,
        rewrite.resolve_path_relative(RFC3986_BASE_PATH, ref),
        label
    )
end

-- §5.4.1 Normal Examples (path-relative subset)
assert_resolve("g", "/b/c/g", "RFC 3986 §5.4.1 g")
assert_resolve("./g", "/b/c/g", "RFC 3986 §5.4.1 ./g")
assert_resolve("g/", "/b/c/g/", "RFC 3986 §5.4.1 g/")
assert_resolve("g?y", "/b/c/g?y", "RFC 3986 §5.4.1 g?y")
assert_resolve("g#s", "/b/c/g#s", "RFC 3986 §5.4.1 g#s")
assert_resolve("g?y#s", "/b/c/g?y#s", "RFC 3986 §5.4.1 g?y#s")
assert_resolve(";x", "/b/c/;x", "RFC 3986 §5.4.1 ;x")
assert_resolve("g;x", "/b/c/g;x", "RFC 3986 §5.4.1 g;x")
assert_resolve("g;x?y#s", "/b/c/g;x?y#s", "RFC 3986 §5.4.1 g;x?y#s")
assert_resolve(".", "/b/c/", "RFC 3986 §5.4.1 .")
assert_resolve("./", "/b/c/", "RFC 3986 §5.4.1 ./")
assert_resolve("..", "/b/", "RFC 3986 §5.4.1 ..")
assert_resolve("../", "/b/", "RFC 3986 §5.4.1 ../")
assert_resolve("../g", "/b/g", "RFC 3986 §5.4.1 ../g")
assert_resolve("../..", "/", "RFC 3986 §5.4.1 ../..")
assert_resolve("../../", "/", "RFC 3986 §5.4.1 ../../")
assert_resolve("../../g", "/g", "RFC 3986 §5.4.1 ../../g")

-- §5.4.2 Abnormal Examples (path-relative subset + query/fragment isolation)
assert_resolve("../../../g", "/g", "RFC 3986 §5.4.2 ../../../g")
assert_resolve("../../../../g", "/g", "RFC 3986 §5.4.2 ../../../../g")
assert_resolve("g.", "/b/c/g.", "RFC 3986 §5.4.2 g.")
assert_resolve(".g", "/b/c/.g", "RFC 3986 §5.4.2 .g")
assert_resolve("g..", "/b/c/g..", "RFC 3986 §5.4.2 g..")
assert_resolve("..g", "/b/c/..g", "RFC 3986 §5.4.2 ..g")
assert_resolve("./../g", "/b/g", "RFC 3986 §5.4.2 ./../g")
assert_resolve("./g/.", "/b/c/g/", "RFC 3986 §5.4.2 ./g/.")
assert_resolve("g/./h", "/b/c/g/h", "RFC 3986 §5.4.2 g/./h")
assert_resolve("g/../h", "/b/c/h", "RFC 3986 §5.4.2 g/../h")
assert_resolve("g;x=1/./y", "/b/c/g;x=1/y", "RFC 3986 §5.4.2 g;x=1/./y")
assert_resolve("g;x=1/../y", "/b/c/y", "RFC 3986 §5.4.2 g;x=1/../y")
assert_resolve("g?y/./x", "/b/c/g?y/./x", "RFC 3986 §5.4.2 g?y/./x")
assert_resolve("g?y/../x", "/b/c/g?y/../x", "RFC 3986 §5.4.2 g?y/../x")
assert_resolve("g#s/./x", "/b/c/g#s/./x", "RFC 3986 §5.4.2 g#s/./x")
assert_resolve("g#s/../x", "/b/c/g#s/../x", "RFC 3986 §5.4.2 g#s/../x")

-- Bridge-oriented resolve checks (same helper)
assert_eq(
    "/x-nmos/connection/v1.1/single/receivers/r1/active",
    rewrite.resolve_path_relative("/x-nmos/connection/v1.1/single/receivers/r1/staged", "active"),
    "resolve_path_relative sibling"
)
assert_eq(
    "/x-nmos/connection/v1.1/single/senders/s1",
    rewrite.resolve_path_relative("/x-nmos/connection/v1.1/single/receivers/r1/staged", "../../senders/s1"),
    "resolve_path_relative up"
)

do
    local scheme, host, port, pathquery =
        rewrite.parse_absolute("HTTP://Device.Example:8080/x-nmos/connection/v1.1/foo")
    assert_eq("http", scheme, "parse_absolute scheme")
    assert_eq("Device.Example", host, "parse_absolute host")
    assert_eq("8080", port, "parse_absolute port")
    assert_eq("/x-nmos/connection/v1.1/foo", pathquery, "parse_absolute path")
end

assert_nil(select(1, rewrite.parse_absolute("http://")), "parse_absolute empty authority")
assert_nil(select(1, rewrite.parse_absolute("http:///path")), "parse_absolute missing authority")
assert_nil(select(1, rewrite.parse_absolute("not-a-url")), "parse_absolute no scheme")

assert_eq(
    "/x-nmos-bridge/v1.0/devices/d1/connection/v1.1/single/receivers/r1",
    rewrite.rewrite_onto_bridge(
        "/x-nmos/connection/v1.1/single/receivers/r1",
        "/x-nmos/connection/v1.1",
        "/x-nmos-bridge/v1.0/devices/d1/connection/v1.1"
    ),
    "rewrite_onto_bridge in-base"
)
assert_nil(
    rewrite.rewrite_onto_bridge(
        "/x-manifest/foo",
        "/x-nmos/connection/v1.1",
        "/x-nmos-bridge/v1.0/devices/d1/connection/v1.1"
    ),
    "rewrite_onto_bridge out-of-base"
)

-- ---------------------------------------------------------------------------
-- handle_location policy
-- ---------------------------------------------------------------------------

local BASE = "/x-nmos/connection/v1.1"
local BRIDGE = "/x-nmos-bridge/v1.0/devices/d1/connection/v1.1"
local DOWN =
    "/x-nmos-bridge/v1.0/devices/d1/connection/v1.1/single/receivers/r1/staged"
local AUTHS = "device.local:80,10.0.0.5:80"

local function handle(location, extras)
    extras = extras or {}
    return rewrite.handle_location(
        location,
        extras.base_path or BASE,
        extras.bridge_path or BRIDGE,
        extras.bridge_scheme or "http",
        extras.bridge_host or "controller.example:8080",
        extras.upstream_scheme or "http",
        extras.upstream_authorities or AUTHS,
        extras.downstream_path or DOWN
    )
end

assert_nil(handle(nil), "empty: nil location")
assert_nil(handle(""), "empty: empty string")

assert_eq(
    BRIDGE .. "/single/receivers/r1/active",
    handle("/x-nmos/connection/v1.1/single/receivers/r1/active"),
    "root-relative in-base -> bridge path"
)
assert_eq(BRIDGE, handle(BASE), "root-relative exact base_path -> bridge path")
assert_eq(
    BRIDGE .. "/single/receivers/r1/active?x=1",
    handle("/x-nmos/connection/v1.1/single/receivers/r1/active?x=1"),
    "root-relative in-base preserves query"
)
assert_eq("reject", handle("/x-manifest/stream"), "root-relative out-of-base -> reject")

assert_eq(
    BRIDGE .. "/single/receivers/r1/active",
    handle("active"),
    "path-relative sibling -> bridge"
)
assert_eq(
    "reject",
    handle("../../../../../x-manifest/foo"),
    "path-relative escapes Connection API base -> reject"
)

assert_eq(
    "http://controller.example:8080" .. BRIDGE .. "/single/receivers/r1/active",
    handle("http://device.local/x-nmos/connection/v1.1/single/receivers/r1/active"),
    "absolute candidate in-base -> bridge absolute"
)
assert_eq(
    "http://controller.example:8080" .. BRIDGE .. "/single/receivers/r1/active?x=1",
    handle("http://device.local/x-nmos/connection/v1.1/single/receivers/r1/active?x=1"),
    "absolute candidate in-base preserves query"
)
assert_eq(
    "http://controller.example:8080" .. BRIDGE .. "/single/senders/s1",
    handle("http://10.0.0.5/x-nmos/connection/v1.1/single/senders/s1"),
    "absolute other candidate in-base -> bridge absolute"
)
assert_eq(
    "http://controller.example:8080" .. BRIDGE .. "/single/receivers/r1/active",
    handle(
        "http://device.local:80/x-nmos/connection/v1.1/single/receivers/r1/active",
        { upstream_authorities = "device.local" }
    ),
    "absolute explicit :80 matches authority without port"
)
assert_eq(
    "http://controller.example:8080" .. BRIDGE .. "/single/receivers/r1/active",
    handle("http://Device.Local/x-nmos/connection/v1.1/single/receivers/r1/active"),
    "absolute candidate host match is case-insensitive"
)
assert_eq(
    "http://controller.example:8080" .. BRIDGE .. "/single/receivers/r1/active",
    handle(
        "http://[2001:db8::1]/x-nmos/connection/v1.1/single/receivers/r1/active",
        { upstream_authorities = "[2001:db8::1]:80" }
    ),
    "absolute IPv6 candidate in-base -> bridge absolute"
)
assert_nil(
    handle("http://foreign.example/x-nmos/connection/v1.1/single/receivers/r1"),
    "foreign absolute -> leave unchanged"
)
assert_nil(
    handle("http://device.local/x-manifest/foo"),
    "candidate absolute outside base -> leave unchanged"
)
assert_eq(
    "http://controller.example:8080" .. BRIDGE .. "/single/receivers/r1/active",
    handle("//device.local/x-nmos/connection/v1.1/single/receivers/r1/active"),
    "scheme-relative candidate in-base uses client scheme"
)
assert_eq(
    "https://controller.example" .. BRIDGE .. "/single/receivers/r1/active",
    handle(
        "//device.local/x-nmos/connection/v1.1/single/receivers/r1/active",
        {
            bridge_scheme = "https",
            bridge_host = "controller.example",
            upstream_scheme = "https",
            upstream_authorities = "device.local:443",
        }
    ),
    "scheme-relative with https client and https upstream"
)
assert_nil(
    handle(
        "//device.local/x-nmos/connection/v1.1/single/receivers/r1/active",
        { bridge_scheme = "https", bridge_host = "controller.example" }
    ),
    "scheme-relative https client vs http upstream -> leave unchanged"
)
assert_nil(
    handle("https://device.local/x-nmos/connection/v1.1/single/receivers/r1"),
    "https absolute when upstream is http -> leave unchanged"
)
assert_eq("reject", handle("ftp://device.local/foo"), "non-http(s) absolute -> reject")
assert_eq("reject", handle("http://"), "malformed absolute -> reject")
assert_eq("reject", handle("http:///x-nmos/connection/v1.1/"), "absolute missing authority -> reject")

if failures > 0 then
    io.stderr:write(string.format("%d failure(s)\n", failures))
    os.exit(1)
end
print("ok")
