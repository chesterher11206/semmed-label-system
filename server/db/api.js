import bookshelf from 'bookshelf'
import knex from 'knex'
import { attachPaginate } from 'knex-paginate';
import Promise from 'bluebird'
import upsert from 'bookshelf-upsert'
import NodeCache from 'node-cache'
import { labelSystemConfig, semmedDBConfig } from './config.js'

attachPaginate();

const cache = new NodeCache();

const labelSystemKnex = knex(labelSystemConfig);
const labelSystemBookshelf = bookshelf(labelSystemKnex);
labelSystemBookshelf.plugin(upsert);

const Correctness = labelSystemBookshelf.model('Correctness', {
    tableName: 'CORRECTNESS',
    idAttribute: 'TRIPLET_ID'
});

const semmedDBKnex = knex(semmedDBConfig);
const semmedDBBookshelf = bookshelf(semmedDBKnex);

const Sentence = semmedDBBookshelf.model('Sentence', {
    tableName: 'SENTENCE'
});

const Citation = semmedDBBookshelf.model('Citation', {
    tableName: 'CITATIONS'
});

const Triplet = labelSystemBookshelf.model('ARB_GROUP', {
    tableName: 'ARB_GROUP',
    label() {
        return this.hasOne(Correctness, 'TRIPLET_ID', 'TRIPLET_ID');
    }
});

const Predication = semmedDBBookshelf.model('Predication', {
    tableName: 'PREDICATION',
    sentence() {
        return this.hasOne(Sentence, 'SENTENCE_ID', 'SENTENCE_ID');
    },
    year() {
        return this.hasOne(Citation, 'PMID', 'PMID');
    }
});

const fetchCaseConfigs = (req, res) => {
    const query = req.query;
    const cacheKey = `caseConfig_${JSON.stringify(query)}`;
    var caseConfig = cache.get(cacheKey);
    if (caseConfig !== undefined) {
        res.json(caseConfig);
        return;
    }

    const caseConfigTemplete = {
        AB: {
            subject: {
                label: 'A',
                options: {
                    name: []
                }
            },
            object: {
                label: 'B',
                options: {
                    name: [],
                    semgroup: [],
                    semtype: []
                }
            }
        },
        BC: {
            subject: {
                label: 'B',
                options: {
                    name: [],
                    semgroup: [],
                    semtype: []
                }
            },
            object: {
                label: 'C',
                options: {
                    name: [],
                    semgroup: [],
                    semtype: []
                }
            }
        }
    };
    caseConfig = caseConfigTemplete[query.case];

    const columnDistinct = (tableName, columnName) => {
        return labelSystemKnex(tableName).distinct(columnName)
        .then((result) => {
            if (columnName == 'subject_name' ||  columnName == 'object_name')
                return JSON.parse(JSON.stringify(result)).map(r => r[columnName]);

            var ret = [];
            for (var r of JSON.parse(JSON.stringify(result))) {
                ret = ret.concat(JSON.parse(r[columnName]))
            }
            return [...new Set(ret)];
        });
    };

    const caseList = [];
    for (var entityName in caseConfig) {
        for (var optionName in caseConfig[entityName].options) {
            caseList.push([entityName, optionName]);
        }
    }

    Promise.all(caseList.map(c => columnDistinct(`${query.case}_GROUP`, `${c[0]}_${c[1]}`)))
    .then(values => {
        caseList.forEach((item, index) => {
            values[index].sort();
            caseConfig[item[0]].options[item[1]] = values[index];
        })
        cache.set(cacheKey, caseConfig, 10000);
        res.json(caseConfig);
    })
};

const fetchCase = (req, res) => {
    const query = req.query;
    var totalRows = 0;

    labelSystemKnex(`${query.case}_GROUP`).where((builder) => {
        if (query.filters) {
            for (var [key, value] of Object.entries(JSON.parse(query.filters))) {
                if (value.length > 0) {
                    if (key == 'subject_name' ||  key == 'object_name')
                        builder.orWhereIn(key, value);
                    else {
                        for (var v of value) {
                            builder.orWhere(key, 'like', `%"${v}"%`);
                        }
                    }
                }
            }
        }
    })
    .paginate({ perPage: query.perPage, currentPage: query.page, isLengthAware: true })
    .then(pageResp => {
        totalRows = pageResp.pagination.total;
        return JSON.parse(JSON.stringify(pageResp.data));
    })
    .then(data => {
        var result = data.map(({
            TRIPLET_IDS,
            ...rest
        }) => {
            const ids = JSON.parse(TRIPLET_IDS);
            return labelSystemKnex('CORRECTNESS')
            .select(labelSystemKnex.raw('count(if(LABEL IS NOT NULL, true, null)) as cnt'))
            .whereIn('TRIPLET_ID', ids)
            .then(resp => ({
                ...rest,
                TRIPLET_IDS,
                labeled: JSON.parse(JSON.stringify(resp))[0].cnt
            }))
        })

        return Promise.all(result);
    })
    .then(result => {
        res.json({
            result,
            totalRows
        });
    });
}

const fetchTriplet = (req, res) => {
    const { subjectName, objectName, ids } = req.query;
    const cacheKey = `triplet_${JSON.stringify({ subjectName, objectName })}`;
    var caseResult = cache.get(cacheKey);
    if (caseResult !== undefined) {
        res.json(caseResult);
        return;
    }

    new Triplet().where('TRIPLET_ID', 'IN', JSON.parse(ids)).fetchAll({ withRelated: ['label'] })
    .then(model => {
        var result = model.toJSON().map(({
            PREDICATION_IDS,
            label: { LABEL = null } = {},
            ...rest
        }) => {
            return Predication.where('PREDICATION_ID', 'IN', JSON.parse(PREDICATION_IDS))
            .fetchAll({withRelated: ['sentence', 'year']})
            .then(model => {
                const predications = model.toJSON().map(({
                    PMID, SUBJECT_SEMTYPE, OBJECT_SEMTYPE,
                    year: { PYEAR },
                    sentence: { SENTENCE }
                }) => ({
                    PMID, SUBJECT_SEMTYPE, OBJECT_SEMTYPE, PYEAR, SENTENCE
                }));

                predications.sort((a, b) => (a.PYEAR > b.PYEAR) ? 1 : -1);

                return { ...rest, LABEL, predications }
            })
        });

        return Promise.all(result);
    })
    .then(result => {
        caseResult = JSON.parse(JSON.stringify(result));
        cache.set(cacheKey, caseResult, 10000);
        res.json(caseResult);
    });
}

const updateLabel = (req, res) => {
    const { subjectName, objectName, triplet } = req.body;
    const cacheKey = `triplet_${JSON.stringify({ subjectName, objectName })}`;

    labelSystemBookshelf.transaction(function(t) {
        return Promise.map(triplet, function({ TRIPLET_ID, LABEL }) {
            return new Correctness({ TRIPLET_ID }).upsert({
                LABEL
            }, {
                transacting: t
            });
    
        });
    })
    .then(() => {
        cache.set(cacheKey, triplet, 10000);
        res.json({ message: 'Success' });
    })
    .catch((error) => { res.status(500).json({ message: error.message }); });
}

export {
    fetchCaseConfigs,
    fetchCase,
    fetchTriplet,
    updateLabel
};