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
    let {score} = JSON.parse(event.body)
    const { "cognito:username": username } = jwt_decode(event.headers["Authorization"]);
    context.callbackWaitsForEmptyEventLoop = false;
	pool.getConnection((err, con) => {
        const response = {}
        if(!err && /^[0-9]*$/.test(score) && score < 2147483647){
            response.body = []
            var sql = "";
           
            response.body.push("inserendo "+ username)
            sql += `
    			replace into buffer(username, duration, score) 
    			select tmp.username,  coalesce(b.duration, 0), if(b.score > tmp.score , b.score, tmp.score) score
    			from buffer b right join (SELECT ? as username, ? as score) tmp on b.username = tmp.username 
    			where tmp.username = ?;`;
    		var values = [username, score, username]
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
                        message: "Update successful"
                    })
                    callback(null, response);
                }
                
            });
        } else {
            response.statusCode = 401
            response.body = JSON.stringify({
                message: "score must be a positive integer value without sign less than 2147483647... or the connection to the DB is failed"
            })
            callback(null, response);
        }
	});
};
