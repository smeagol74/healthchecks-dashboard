(function () {

    var style = {
        panel: 'hc-panel',
        tags: 'hc-panel__tags',
        tag: {
            __class: 'hc-panel__tags__tag',
            active: 'hc-panel__tags__tag--active',
            status: function (status) {
                return style.tag.__class + '--' + status;
            }
        },
        nodes: 'hc-panel__nodes',
        node: {
            __class: 'hc-node',
            hidden: 'hc-node--hidden',
            status: function (status) {
                return style.node.__class + '--' + status;
            }
        },
        nodeStatus: {
            __class: 'hc-node__status',
            icon: 'hc-node__status-icon',
            duration: 'hc-node__status-duration',
            time: 'hc-node__status-time'
        },
        nodeInfo: {
            __class: 'hc-node__info',
            name: 'hc-node__info-name',
            desc: 'hc-node__info-desc',
            tags: 'hc-node__info-tags',
            tag: 'hc-node__info-tags__tag'
        }
    };

    function plural(term, count) {
        return term + (count === 1 ? '' : 's');
    }

    function timeSince(date) {
        var v = Math.floor((new Date() - date) / 1000);

        if (v < 60) { // v is seconds
            return v + ' ' + plural('second', v);
        }

        v = Math.floor(v / 60); // v is now minutes
        if (v < 60) {
            return v + ' ' + plural('minute', v);
        }

        v = Math.floor(v / 60); // v is now hours
        if (v < 24) {
            return v + ' ' + plural('hour', v);
        }

        v = Math.floor(v / 24); // v is now days
        return v + ' ' + plural('day', v);
    }

    function fetch(key, host, callback) {
        if (!host) {
            host = 'healthchecks.io'
        }
        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === 4) {
                if (httpRequest.status === 200) {
                    callback(JSON.parse(httpRequest.responseText));
                }
            }
        };
        httpRequest.open('GET', 'https://' + host + '/api/v1/checks/');
        httpRequest.setRequestHeader('X-Api-Key', key);
        httpRequest.send();
    }

    function _timeSince($node, time) {
        if ($node) {
            var text = 'never';
            if (time) {
                text = timeSince(Date.parse(time)) + " ago";
            }
            $node.innerText = text;
        }
    }

    function _pad0(num) {
        if (num < 10) {
            return '0' + num;
        } else {
            return '' + num;
        }
    }

    function _duration($node, time) {
        if ($node) {
            var text = '--:--'
            if (time) {
                if (time < 60) {
                    text = '00:' + _pad0(time);
                } else if (time < 3600) {
                    text = _pad0(Math.trunc(time / 60)) + ':' + _pad0(time % 60);
                } else {
                    text = '' + Math.trunc(time / 3600) + ':' + _pad0(Math.trunc((time % 3600) / 60)) + ':' + _pad0(time % 60);
                }
            }
            $node.innerText = text;
        }
    }

    function _name($node, name) {
        if ($node) {
            $node.innerText = name || 'unnamed';
        }
    }

    function _desc($node, desc) {
        if ($node && desc) {
            var body = '';
            desc.split('\n').forEach(function (row) {
                row = row.trim();
                if (row) {
                    body += '<p>' + row + '</p>';
                }
            });
            $node.innerHTML = body;
        }
    }

    function _nodeTags(tags, name, filteredTag) {
        name = name && name.trim().toLowerCase();
        return (tags || '').split(' ')
            .map(function (t) {
                return t.trim().toLocaleString();
            })
            .filter(function (t) {
                return t !== '' && (!name || t !== name) && (!filteredTag || t !== filteredTag);
            });
    }

    function _tags($node, tags) {
        if ($node && tags) {
            var result = '';
            tags.forEach(function (tag) {
                result += template.info.tag.replaceAll('{{ tag }}', tag);
            });
            $node.innerHTML = result;
        }
    }

    function _hasTag(tags, tag) {
        return !tag || _nodeTags(tags).indexOf(tag.trim().toLowerCase()) > -1;
    }

    function renderNode($panel, filteredTag) {
        return function (item) {
            if (_hasTag(item.tags, filteredTag)) {
                var $item = $template.cloneNode(true);
                delete $item.dataset.hcTemplate;
                $item.classList.add(style.node.status(item.status));
                $item.dataset.hcTags = item.tags;
                _duration($item.querySelector('.' + style.nodeStatus.duration), item.last_duration);
                _timeSince($item.querySelector('.' + style.nodeStatus.time), item.last_ping);
                _name($item.querySelector('.' + style.nodeInfo.name), item.name);
                _desc($item.querySelector('.' + style.nodeInfo.desc), item.desc);
                _tags($item.querySelector('.' + style.nodeInfo.tags), _nodeTags(item.tags, item.name, filteredTag));
                $panel.appendChild($item);
            }
        }
    }

    var statusOrder = ['new', 'started', 'paused', 'up', 'grace', 'down'];

    function _compareStatuses(a, b) {
        return statusOrder.indexOf(a) - statusOrder.indexOf(b);
    }

    function _worstStatus(statuses) {
        return statuses.sort(_compareStatuses).reverse()[0];
    }

    function _unhideNodes($nodes) {
        $nodes.querySelectorAll('.' + style.node.hidden)
            .forEach(function ($node) {
                $node.classList.remove(style.node.hidden);
            })
    }

    function _hideNodesExceptTag($nodes, tag) {
        $nodes.querySelectorAll('.' + style.node.__class)
            .forEach(function ($node) {
                $node.classList.remove(style.node.hidden);
                if (!_hasTag($node.dataset.hcTags, tag)) {
                    $node.classList.add(style.node.hidden);
                }
            });
    }

    function _onTagClick(event) {
        var $tag = event.target;
        var nonActive = !$tag.classList.contains(style.tag.active);
        var $tags = $tag.parentElement;
        $tags
            .querySelectorAll('.' + style.tag.active)
            .forEach(function ($node) {
                $node.classList.remove(style.tag.active);
            });
        var $nodes = $tags.parentElement.querySelector('.' + style.nodes);
        _unhideNodes($nodes);
        if (nonActive) {
            $tag.classList.add(style.tag.active);
            _hideNodesExceptTag($nodes, $tag.dataset.hcTag);
        }
    }

    function renderPanelTags($panel, items, filteredTag) {
        var tags = [];
        var status = {};
        items.forEach(function (item) {
            if (_hasTag(item.tags, filteredTag)) {
                _nodeTags(item.tags, item.name, filteredTag).forEach(function (tag) {
                    if (tags.indexOf(tag) === -1) {
                        tags.push(tag);
                    }
                    status[tag] = status[tag] || [];
                    if (status[tag].indexOf(item.status) === -1) {
                        status[tag].push(item.status);
                    }
                });
            }
        });
        tags = tags.sort(function (a, b) {
            return a.localeCompare(b);
        });
        if (tags.length > 1) {
            tags.forEach(function (tag) {
                var $tag = document.createElement('div');
                $panel.appendChild($tag);
                $tag.outerHTML = template.tags.tag.replaceAll('{{ tag }}', tag);
                $tag = $panel.querySelector('.' + style.tag.__class + ':last-of-type');
                $tag.classList.add(style.tag.status(_worstStatus(status[tag])));
                $tag.dataset.hcTag = tag;
                $tag.addEventListener('click', _onTagClick);
            });
        }
    }

    function renderPanel($node) {
        var filteredTag = $node.dataset.hcTag && $node.dataset.hcTag.toLowerCase() || undefined;
        return function (resp) {
            // Sort returned checks by name:
            var sorted = resp.checks.sort(function (a, b) {
                return a.name.localeCompare(b.name)
            });

            $node.innerHTML = template.panel;
            $node.classList.add(style.panel);
            var $nodes = $node.querySelector('.' + style.nodes);
            renderPanelTags($node.querySelector('.' + style.tags), sorted, filteredTag)
            sorted.forEach(renderNode($nodes, filteredTag));
        }
    }

    function updatePanel($node) {
        fetch($node.dataset.hcKey, $node.dataset.hcHost, renderPanel($node));
    }

    var $template;
    var template = {
        panel: '<div class="' + style.tags + '"></div>' +
            '<div class="' + style.nodes + '"></div>',
        node: '<div data-hc-template class="' + style.node.__class + '">' +
            '  <div class="' + style.nodeStatus.__class + '">' +
            '    <div class="' + style.nodeStatus.icon + '"></div>' +
            '    <div class="' + style.nodeStatus.duration + '"></div>' +
            '    <div class="' + style.nodeStatus.time + '"></div>' +
            '  </div>' +
            '  <div class="' + style.nodeInfo.__class + '">' +
            '    <div class="' + style.nodeInfo.name + '"></div>' +
            '    <div class="' + style.nodeInfo.desc + '"></div>' +
            '    <div class="' + style.nodeInfo.tags + '"></div>' +
            '  </div>' +
            '</div>',
        tags: {
            tag: '<div class="' + style.tag.__class + '">{{ tag }}</div>'
        },
        info: {
            tag: '<div class="' + style.nodeInfo.tag + '">{{ tag }}</div>'
        }
    };


    function onPageLoad() {
        $template = document.querySelector('[data-hc-template]');
        if (!$template) {
            $template = document.createElement('div');
            document.body.appendChild($template);
            $template.outerHTML = template.node;
        }
        setTimeout(function () {
            $template = document.querySelector('[data-hc-template]');
            document.querySelectorAll('[data-hc-key]').forEach(updatePanel);
            document.querySelectorAll('[data-hc-refresh]').forEach(function ($node) {
                var interval = parseInt($node.dataset.hcRefresh);
                if (!interval || isNaN(interval)) {
                    interval = 5;
                }
                setInterval(function () {
                    updatePanel($node);
                }, interval * 1000);
            });
        }, 100);
    }

    window.addEventListener('load', onPageLoad);
}());

