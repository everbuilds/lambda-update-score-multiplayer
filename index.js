const mysql = require("mysql");
const jwt_decode = require("jwt-decode");

const pool = mysql.createPool({
    multipleStatements: true,
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD, 
	database: process.env.DB_NAME,
});

exports.handler =  (event, context, callback) => {
    let {defeated} = JSON.parse(event.body)
    const { "cognito:username": username } = jwt_decode(event.headers["Authorization"]);
    context.callbackWaitsForEmptyEventLoop = false;
	pool.getConnection((err, con) => {
        const response = {}
        if(!err && /^[0-9]*$/.test(defeated)){
            response.body = []
            var sql = "";
           
            response.body.push("inserendo "+ username)
            sql += `
    			replace into buffer(username, score, defeated) 
    			select tmp.username,  coalesce(b.score, 0), coalesce(b.defeated,0)+tmp.defeated defeated
    			from buffer b right join (SELECT ? as username, ? as defeated) tmp on b.username = tmp.username 
    			where tmp.username = ?;`;
    		var values = [username, defeated, username]
            con.query(sql, values, function(error, results){
                if(error) {
                    callback(null, {
                        statusCode: 404,
                        body : {
                            message : "ERRORE: "+error
                        }
                    })
                } else {
            		response.statusCode = 200;
                    response.body = JSON.stringify({
                        message: "Update successful multi-player"
                    })
                    callback(null, response);
                }
                
            });
        } else {
            response.statusCode = 401
            response.body = JSON.stringify({
                message: "score must be a integer value... or the connection to the DB is failed"
            })
            callback(null, response);
        }
	});
};
