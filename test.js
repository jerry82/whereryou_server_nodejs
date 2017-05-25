var async = require('async');


function test() {

    a = [
    {prop1:"abc",prop2:"qwe"},
    {prop1:"bnmb",prop2:"yutu"},
    {prop1:"zxvz",prop2:"qwrq"}];

    index = a.findIndex(x => x.prop2=="qwrq");

    console.log(index);
    /*
    async.waterfall(
        [
            function(callback) {
                console.log("1");
                callback('err1', 'Yes', 'it');
            },
            function(a1, a2, callback) {
                console.log("2");
                var caption = a1 + ' and ' + a2;
                callback('err2', caption);
            }

        ],
        function(err, caption) {
            console.log(err);
            console.log(caption);
        }
    );*/
}

test();
