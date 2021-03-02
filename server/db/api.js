import bookshelf from 'bookshelf'
import knex from 'knex'
import Promise from 'bluebird'
import upsert from 'bookshelf-upsert'
import NodeCache from 'node-cache'
import { labelSystemConfig, semmedDBConfig } from './config.js'

const cache = new NodeCache();

const labelSystemKnex = knex(labelSystemConfig);
const labelSystemBookshelf = bookshelf(labelSystemKnex);
labelSystemBookshelf.plugin(upsert);

const Correctness = labelSystemBookshelf.model('Correctness', {
    tableName: 'CORRECTNESS',
    idAttribute: 'PMID'
});

const semmedDBKnex = knex(semmedDBConfig);
const semmedDBBookshelf = bookshelf(semmedDBKnex);

const Sentence = semmedDBBookshelf.model('Sentence', {
    tableName: 'SENTENCE'
});

const Predication = semmedDBBookshelf.model('Predication', {
    tableName: 'PREDICATION',
    sentence() {
        return this.hasOne(Sentence, 'SENTENCE_ID', 'SENTENCE_ID');
    },
    label() {
        return this.hasOne(Correctness, 'PMID', 'PMID');
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
            return JSON.parse(JSON.stringify(result)).map(r => r[columnName]);
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
    const cacheKey = `case_${JSON.stringify(query)}`;
    var caseResult = cache.get(cacheKey);
    if (caseResult !== undefined) {
        res.json(caseResult);
        return;
    }

    labelSystemKnex(`${query.case}_GROUP`).where((builder) => {
        if (query.filters) {
            for (var [key, value] of Object.entries(JSON.parse(query.filters))) {
                if (value.length > 0) {
                    builder.orWhereIn(key, value);
                }
            }
        }
    })
    .then(result => {
        caseResult = JSON.parse(JSON.stringify(result));
        cache.set(cacheKey, caseResult, 10000);
        res.json(caseResult);
    });
}

const fetchDetail = (req, res) => {
    const { subjectName, objectName, ids } = req.query;
    const cacheKey = `detail_${JSON.stringify({ subjectName, objectName })}`;
    var caseResult = cache.get(cacheKey);
    if (caseResult !== undefined) {
        res.json(caseResult);
        return;
    }

    new Predication().where('PREDICATION_ID', 'IN', JSON.parse(ids)).fetchAll({withRelated: ['sentence', 'label']})
    .then((model) => {
        const result = model.toJSON().map(({ PMID, PREDICATE, sentence: { SENTENCE }, label: { LABEL = null } = {} }) => ({
            PMID,
            PREDICATE,
            SENTENCE,
            LABEL
        }));

        caseResult = JSON.parse(JSON.stringify(result));
        cache.set(cacheKey, caseResult, 10000);
        res.json(caseResult);
    });
}

const updateLabel = (req, res) => {
    const { subjectName, objectName, detail } = req.body;
    const cacheKey = `detail_${JSON.stringify({ subjectName, objectName })}`;

    labelSystemBookshelf.transaction(function(t) {
        return Promise.map(detail, function(item) {
            return new Correctness({ PMID: item.PMID }).upsert({
                LABEL: item.LABEL
            }, {
                transacting: t
            });
    
        });
    })
    .then(() => {
        cache.set(cacheKey, detail, 10000);
        res.json({ message: 'Success' });
    })
    .catch((error) => { res.status(500).json({ message: error.message }); });
}

export {
    fetchCaseConfigs,
    fetchCase,
    fetchDetail,
    updateLabel
};